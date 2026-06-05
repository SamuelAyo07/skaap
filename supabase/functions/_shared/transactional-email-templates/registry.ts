/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as feedbackRequest } from './feedback-request.tsx'
import { template as ugcWelcome } from './ugc-welcome.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'feedback-request': feedbackRequest,
  'ugc-welcome': ugcWelcome,
}
