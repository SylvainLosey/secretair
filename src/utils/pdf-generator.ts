import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

type Letter = {
  id: string;
  content: string;
  senderName: string;
  senderAddress: string;
  receiverName: string;
  receiverAddress: string;
  signature: string | null;
  createdAt: Date;
}

export async function generatePdfFromLetter(letter: Letter): Promise<Buffer> {
  try {
    // Load the template - fix path to ensure we find the file
    const templatePath = path.join(process.cwd(), 'src/templates/letter.hbs');
    
    console.log('Looking for template at:', templatePath);
    
    let templateSource;
    try {
      templateSource = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
      console.error('Failed to read template at', templatePath);
      // Try alternative path
      const altPath = path.join(process.cwd(), 'templates/letter.hbs');
      console.log('Trying alternative path:', altPath);
      templateSource = fs.readFileSync(altPath, 'utf8');
    }
    
    // Compile the template
    const template = handlebars.compile(templateSource);
    
    // Format date
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Extract first line as subject if possible
    const subject = letter.content.split('\n')[0] || 'Letter';
    
    // Split addresses into arrays for the template
    const senderAddressLines = letter.senderAddress.split('\n');
    const receiverAddressLines = letter.receiverAddress.split('\n');
    
    // Update the variable names to match the template
    const html = template({
      senderName: letter.senderName,
      senderAddress: senderAddressLines,
      receiverName: letter.receiverName,
      receiverAddress: receiverAddressLines,
      content: letter.content,
      signature: letter.signature,
      date: formattedDate,
      subject: subject
    });
    
    // Launch a browser with more options for troubleshooting
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Set content and wait for rendering
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 }
      });
      
      return pdf;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
} 