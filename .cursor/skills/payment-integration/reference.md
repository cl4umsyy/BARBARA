# Payment Integration Reference

## 1. Midtrans Client (`src/lib/midtrans.ts`)

```typescript
import midtransClient from 'midtrans-client';

export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});
```

## 2. Create Snap Token (`src/app/api/payment/create/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { snap } from '@/lib/midtrans';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: session.user.id },
      include: {
        orderItems: true,
        shippingAddress: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const parameter = {
      transaction_details: {
        order_id: order.id,
        gross_amount: Math.round(Number(order.total)),
      },
      item_details: order.orderItems.map((item) => ({
        id: item.variantId,
        price: Math.round(Number(item.price)),
        quantity: item.quantity,
        name: item.productName,
      })),
      customer_details: {
        first_name: order.shippingAddress?.recipientName || session.user.name,
        email: session.user.email,
        phone: order.shippingAddress?.phone || '',
      },
    };

    const transaction = await snap.createTransaction(parameter);

    await prisma.order.update({
      where: { id: orderId },
      data: { midtransId: transaction.token }
    });

    return NextResponse.json({ token: transaction.token });
  } catch (error: any) {
    console.error('Midtrans create error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
```

## 3. Webhook Handler (`src/app/api/payment/notification/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hashData = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const calculatedSignature = crypto
      .createHash('sha512')
      .update(hashData)
      .digest('hex');

    if (calculatedSignature !== signature_key) {
      return NextResponse.json({ error: 'Invalid Signature Key' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: { orderItems: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let paymentStatus = 'PENDING';
    let orderStatus = 'PENDING';
    let shouldRestoreStock = false;

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'PAID';
        orderStatus = 'PROCESSING';
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'PAID';
      orderStatus = 'PROCESSING';
    } else if (['deny', 'cancel', 'expire'].includes(transaction_status)) {
      paymentStatus = 'FAILED';
      orderStatus = 'CANCELLED';
      shouldRestoreStock = true;
    } else if (transaction_status === 'pending') {
      paymentStatus = 'PENDING';
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order_id },
        data: { paymentStatus, status: orderStatus }
      });

      if (shouldRestoreStock) {
        for (const item of order.orderItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { increment: item.quantity }
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Client: load Snap JS dynamically (`https://app.sandbox.midtrans.com/snap/snap.js` in dev).
