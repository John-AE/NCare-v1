import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BillData {
  email: string;
  patient_name: string;
  bill_id: string;
  bill_amount: number;
  bill_items: Array<{
    id?: string;
    service_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  appointment_time: string;
  is_paid: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    const { email, patient_name, bill_id, bill_amount, bill_items, appointment_time, is_paid }: BillData = await req.json();

    console.log('Sending bill email for bill:', bill_id, 'to:', email);
    
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Medical Bill</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
          .container { background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 15px; }
          .info-row { margin-bottom: 8px; }
          .info-label { font-weight: bold; color: #666; display: inline-block; width: 140px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .table th { background-color: #f8f9fa; padding: 12px; text-align: left; border: 1px solid #dee2e6; font-weight: bold; }
          .table td { padding: 12px; border: 1px solid #dee2e6; }
          .total-section { margin-top: 20px; text-align: right; }
          .total-amount { font-size: 18px; font-weight: bold; color: #22c55e; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: bold; }
          .status-pending { background-color: #fef3c7; color: #d97706; }
          .status-paid { background-color: #d1fae5; color: #059669; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .footer a { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Medical Bill</h1>
          </div>
          
          <div class="section">
            <div class="section-title">Patient Information</div>
            <div class="info-row">
              <span class="info-label">Name:</span> ${patient_name}
            </div>
            <div class="info-row">
              <span class="info-label">Appointment Time:</span> ${appointment_time}
            </div>
            <div class="info-row">
              <span class="info-label">Bill ID:</span> ${bill_id}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Bill Items</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${bill_items.map(item => `
                  <tr>
                    <td>${item.service_name}</td>
                    <td>${item.quantity}</td>
                    <td>₦${item.unit_price.toLocaleString()}</td>
                    <td>₦${item.total_price.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total-section">
            <div style="margin-bottom: 10px;">
              <strong>Total Amount: <span class="total-amount">₦${bill_amount?.toLocaleString() || 'N/A'}</span></strong>
            </div>
            <div>
              <strong>Status:</strong> 
              <span class="status ${is_paid ? 'status-paid' : 'status-pending'}">
                ${is_paid ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing NCare Nigeria</p>
            <p>For questions, please contact us at <a href="mailto:billing@123185.xyz">billing@123185.xyz</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('Sending email via Resend to:', email);

    const emailResponse = await resend.emails.send({
      from: 'NCare Nigeria <billing@123185.xyz>',
      to: [email],
      subject: `Medical Bill - ${patient_name}`,
      html: emailContent,
    });

    console.log('Resend response:', emailResponse);

    if (emailResponse.error) {
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bill email sent successfully',
        billId: bill_id,
        emailId: emailResponse.data?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-bill-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send bill email' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});