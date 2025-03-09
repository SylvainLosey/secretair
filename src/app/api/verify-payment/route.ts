import { NextResponse } from 'next/server';
import { stripe } from '~/lib/stripe';
import { db } from '~/server/db';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID' },
        { status: 400 }
      );
    }
    
    // Check payment status
    const paymentSuccessful = session.payment_status === 'paid';
    
    // Get letter ID from metadata
    const letterId = session.metadata?.letterId;
    
    if (letterId && paymentSuccessful) {
      // Update letter status in database
      await db.letter.update({
        where: { id: letterId },
        data: {
          status: 'paid',
          // You might want to store other payment details
          paymentId: session.id,
          paymentAmount: session.amount_total ? session.amount_total / 100 : null,
        },
      });
    }
    
    return NextResponse.json({ 
      success: paymentSuccessful,
      paymentStatus: session.payment_status,
      customer: session.customer_details?.email || null,
    });
    
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 