import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { Letter } from '@prisma/client';

// Register default fonts if needed
// Font.register({
//   family: 'Open Sans',
//   src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf',
// });

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
  },
  senderSection: {
    marginBottom: 50,
  },
  receiverSection: {
    marginBottom: 50,
  },
  dateSection: {
    alignSelf: 'flex-end',
    marginBottom: 30,
  },
  subjectSection: {
    marginBottom: 20,
  },
  contentSection: {
    marginBottom: 50,
    lineHeight: 1.5,
  },
  closingSection: {
    marginBottom: 10,
  },
  signatureSection: {
    height: 50,
    marginBottom: 10,
  },
  signatureImage: {
    height: 40,
    width: 150,
    objectFit: 'contain',
  },
  text: {
    fontSize: 11,
    marginBottom: 5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
  },
});

// Use a proper React functional component
const LetterPDF = ({ letter }: { letter: Letter }) => {
  // Format date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Extract first line as subject
  const contentLines = letter.content?.split('\n') || [''];
  const subject = contentLines[0] || 'Letter';
  const contentWithoutSubject = contentLines.slice(1).join('\n');

  // Split addresses
  const senderAddressLines = letter.senderAddress?.split('\n') || [];
  const receiverAddressLines = letter.receiverAddress?.split('\n') || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sender Information */}
        <View style={styles.senderSection}>
          <Text style={styles.bold}>{letter.senderName || ''}</Text>
          {senderAddressLines.map((line, index) => (
            <Text key={`sender-${index}`} style={styles.text}>{line}</Text>
          ))}
        </View>

        {/* Receiver Information */}
        <View style={styles.receiverSection}>
          <Text style={styles.bold}>{letter.receiverName || ''}</Text>
          {receiverAddressLines.map((line, index) => (
            <Text key={`receiver-${index}`} style={styles.text}>{line}</Text>
          ))}
        </View>

        {/* Date */}
        <View style={styles.dateSection}>
          <Text style={styles.text}>{formattedDate}</Text>
        </View>

        {/* Subject */}
        <View style={styles.subjectSection}>
          <Text style={styles.bold}>Subject: {subject}</Text>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          <Text style={styles.text}>{contentWithoutSubject}</Text>
        </View>

        {/* Closing */}
        <View style={styles.closingSection}>
          <Text style={styles.text}>Sincerely,</Text>
        </View>

        {/* Signature - Fix for the missing/incomplete image tag */}
        {letter.signature && (
          <View style={styles.signatureSection}>
            <Image src={letter.signature} style={styles.signatureImage} />
          </View>
        )}

        {/* Sender Name */}
        <Text style={styles.bold}>{letter.senderName || ''}</Text>
      </Page>
    </Document>
  );
};

export default LetterPDF; 