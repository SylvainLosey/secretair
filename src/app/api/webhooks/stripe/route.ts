import { NextResponse } from 'next/server';
import { stripe } from '~/lib/stripe';
import { env } from '~/env';
import { headers } from 'next/headers';
import { db } from '~/server/db';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }

  try {
    // Verify the event comes from Stripe
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );

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
          
          // Here you would also trigger your fulfillment service
          // to actually print and send the letter
          // await triggerLetterFulfillment(letterId);
          
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

// This prevents NextJS from parsing the request body before we can verify the webhook
export const config = {
  api: {
    bodyParser: false,
  },
}; 