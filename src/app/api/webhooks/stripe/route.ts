import { NextResponse } from 'next/server';
import { stripe } from '~/lib/stripe';
import { headers } from 'next/headers';
import { db } from '~/server/db';

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not properly initialized' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  try {
    // Log before verifying the webhook signature
    console.log('Received webhook request', {
      signature: signature ? 'Present' : 'Missing',
      secret: process.env.STRIPE_WEBHOOK_SECRET ? 'Present' : 'Missing'
    });

    // Verify the event comes from Stripe
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Log the event type
    console.log(`Processing webhook event: ${event.type}`);

    // Handle different types of events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const letterId = session.metadata?.letterId;
        
        if (letterId && session.payment_status === 'paid') {
          // Update letter status
          await db.letter.update({
            where: { id: letterId },
            data: {
              status: 'paid',
              paymentId: session.id,
              paymentAmount: session.amount_total ? session.amount_total / 100 : null,
            },
          });
          
          console.log(`Payment successful for letter ${letterId}`);
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const letterId = paymentIntent.metadata?.letterId;
        
        if (letterId) {
          await db.letter.update({
            where: { id: letterId },
            data: {
              status: 'payment_failed',
            },
          });
          
          console.log(`Payment failed for letter ${letterId}`);
        }
        break;
      }
      
      // Add other event types as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

// Config for Next.js API routes
export const config = {
  api: {
    bodyParser: false,
  },
}; 