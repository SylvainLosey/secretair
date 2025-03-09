import { NextResponse } from 'next/server';
import { stripe, formatAmountForStripe } from '~/lib/stripe';

export async function POST(request: Request) {
  try {
    const { letterId, letterPrice = 5.99 } = await request.json();
    
    // Create a checkout session with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Letter Delivery Service',
              description: 'Physical letter printing and delivery',
            },
            unit_amount: formatAmountForStripe(letterPrice),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/cancel`,
      metadata: {
        letterId,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the checkout session' },
      { status: 500 }
    );
  }
} 