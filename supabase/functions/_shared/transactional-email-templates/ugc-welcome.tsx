import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Link, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface UgcWelcomeProps {
  name?: string
}

const UgcWelcomeEmail = ({ name }: UgcWelcomeProps) => {
  const greeting = name ? `Welcome to the team, ${name} ✦` : 'Welcome to the team ✦'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>You're officially part of Skaap — lifetime Plus unlocked</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={badge}>SKAAP · UGC CREATOR</Text>
          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            We're so glad to have you. You're not just using Skaap — you're helping
            shape how millions of people will eventually read a food label.
          </Text>
          <Section style={card}>
            <Text style={cardLabel}>YOUR ACCOUNT</Text>
            <Text style={cardValue}>SKAAP Plus · Lifetime access</Text>
            <Text style={cardSub}>No payment. No expiry. Every feature, on us.</Text>
          </Section>
          <Text style={text}>
            That means personalized verdicts, the full 3M+ product search, custom
            ingredient alerts, smart swaps, and everything we ship next — already
            live on your account.
          </Text>
          <Text style={text}>
            Just open the app and you'll see it active. If anything looks off, reply
            to this email and we'll fix it the same day.
          </Text>
          <Text style={text}>
            Thank you for backing us this early. We can't wait to see what you create.
          </Text>
          <Text style={text}>
            Open the app anytime at{' '}
            <Link href="https://useskaap.com" style={link}>useskaap.com</Link>.
          </Text>
          <Text style={footer}>
            With gratitude,<br />
            The Skaap team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: UgcWelcomeEmail,
  subject: "You're officially a Skaap creator — lifetime Plus unlocked ✦",
  displayName: 'UGC welcome',
  previewData: { name: 'Isabella' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 24px', maxWidth: '560px' }
const badge = { fontSize: '11px', fontWeight: 'bold', color: '#C41E3A', letterSpacing: '2px', margin: '0 0 12px' }
const h1 = { fontSize: '26px', fontWeight: 'bold', color: '#0A1220', margin: '0 0 18px', lineHeight: '1.2' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 14px' }
const card = { backgroundColor: '#FFF5F7', borderLeft: '3px solid #C41E3A', padding: '16px 18px', margin: '20px 0', borderRadius: '6px' }
const cardLabel = { fontSize: '10px', fontWeight: 'bold', color: '#C41E3A', letterSpacing: '1.5px', margin: '0 0 6px' }
const cardValue = { fontSize: '16px', fontWeight: 'bold', color: '#0A1220', margin: '0 0 4px' }
const cardSub = { fontSize: '13px', color: '#555555', margin: '0' }
const link = { color: '#C41E3A', textDecoration: 'underline' }
const footer = { fontSize: '14px', color: '#555555', margin: '28px 0 0' }
