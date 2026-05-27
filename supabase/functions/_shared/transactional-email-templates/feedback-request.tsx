import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface FeedbackRequestProps {
  name?: string
}

const FeedbackRequestEmail = ({ name }: FeedbackRequestProps) => {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>A quick thank you and a tiny favor</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{greeting}</Heading>
          <Text style={text}>
            Thank you so much for trying Skaap. It honestly means the world that you
            took the time to scan, sign up, or share something with us.
          </Text>
          <Text style={text}>
            We are still very early, and your honest feedback is the single most
            useful thing we can get right now.
          </Text>
          <Text style={text}>
            Could you reply to this email with one or two lines on:
          </Text>
          <Text style={text}>
            What you liked, what felt confusing, and one thing you wish Skaap did?
          </Text>
          <Text style={text}>
            That is it. No form, no survey, just hit reply.
          </Text>
          <Text style={text}>
            If you want to poke around again, you can open it any time at{' '}
            <Link href="https://useskaap.com" style={link}>useskaap.com</Link>.
          </Text>
          <Text style={footer}>
            Thank you, truly.<br />
            The Skaap team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FeedbackRequestEmail,
  subject: 'Thank you, and a tiny favor',
  displayName: 'Feedback request',
  previewData: { name: 'Sam' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 24px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#0A1220', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.55', margin: '0 0 14px' }
const link = { color: '#C41E3A', textDecoration: 'underline' }
const footer = { fontSize: '14px', color: '#555555', margin: '24px 0 0' }
