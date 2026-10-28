export type FieldType = 'text' | 'number' | 'url' | 'email' | 'secret' | 'dropdown' | 'toggle';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  default?: string;
  hint?: string;
  rows?: number;
}

export interface IntegrationDef {
  id: string;
  category: 'Messaging' | 'AI' | 'Platform' | 'Payments' | 'Sign-in';
  title: string;
  description: string;
  fields: FieldDef[];
}

/**
 * Every outside service the Super Admin can connect. To add one, add an entry
 * here: the form in the web app and the validation on the server both read it.
 */
export const CATALOG: IntegrationDef[] = [
  {
    id: 'email',
    category: 'Messaging',
    title: 'E-mail',
    description: 'Welcome mails, admin invites and announcement e-mails.',
    fields: [
      { key: 'provider', label: 'Provider', type: 'dropdown', required: true, options: ['SMTP', 'Resend', 'SendGrid', 'Mailgun'], default: 'SMTP' },
      { key: 'smtp_host', label: 'SMTP host (Mailgun: sending domain)', type: 'text', hint: 'smtp.yourdomain.com' },
      { key: 'smtp_port', label: 'SMTP port', type: 'number', default: '587' },
      { key: 'username', label: 'SMTP username', type: 'text' },
      { key: 'password', label: 'Password or API key', type: 'secret', required: true },
      { key: 'from_name', label: 'Sender name', type: 'text', default: 'CampusOne' },
      { key: 'from_email', label: 'Sender e-mail', type: 'email', required: true, hint: 'no-reply@yourdomain.com' },
    ],
  },
  {
    id: 'sms',
    category: 'Messaging',
    title: 'SMS',
    description: 'Class texts, one-time codes and urgent SRC alerts.',
    fields: [
      { key: 'provider', label: 'Provider', type: 'dropdown', required: true, options: ['Hubtel', 'mNotify', 'Arkesel', 'Twilio', "Africa's Talking"], default: 'Hubtel' },
      { key: 'client_id', label: 'Client ID / username / account SID', type: 'text' },
      { key: 'api_key', label: 'API key / secret / auth token', type: 'secret', required: true },
      { key: 'sender_id', label: 'Sender ID (Twilio: your number)', type: 'text', required: true, hint: 'Up to 11 characters, e.g. CampusOne' },
    ],
  },
  {
    id: 'push',
    category: 'Messaging',
    title: 'Push notifications',
    description: 'Firebase Cloud Messaging for the Android and iOS apps.',
    fields: [
      { key: 'project_id', label: 'Firebase project ID', type: 'text', required: true, hint: 'campusone-prod' },
      { key: 'service_account', label: 'Service account JSON', type: 'secret', required: true, rows: 6, hint: 'Paste the full JSON key file' },
    ],
  },
  {
    id: 'ai',
    category: 'AI',
    title: 'AI module',
    description: 'One AI connection for the study assistant, quizzes and timetable scanning.',
    fields: [
      { key: 'provider', label: 'Provider', type: 'dropdown', required: true, options: ['Anthropic (Claude)', 'OpenAI', 'Google Gemini', 'Custom (OpenAI-compatible)'], default: 'Anthropic (Claude)' },
      { key: 'api_key', label: 'API key', type: 'secret', required: true },
      { key: 'model', label: 'Model', type: 'text', required: true, hint: 'Model ID from your provider' },
      { key: 'base_url', label: 'Base URL (custom providers only)', type: 'url', hint: 'https://…' },
      { key: 'monthly_cap', label: 'Monthly request cap (optional)', type: 'number' },
      { key: 'f_study_assistant', label: 'Study assistant', type: 'toggle', default: 'true' },
      { key: 'f_quiz', label: 'Quizzes from slides', type: 'toggle', default: 'true' },
      { key: 'f_timetable_scan', label: 'Timetable and course scanning', type: 'toggle', default: 'true' },
      { key: 'f_exam_scan', label: 'Exam timetable scanning', type: 'toggle', default: 'false' },
    ],
  },
  {
    id: 'storage',
    category: 'Platform',
    title: 'File storage',
    description: 'Photos, lecture slides, past questions and listing images.',
    fields: [
      { key: 'provider', label: 'Provider', type: 'dropdown', required: true, options: ['Amazon S3', 'Cloudinary', 'Supabase Storage', 'Firebase Storage'], default: 'Amazon S3' },
      { key: 'bucket', label: 'Bucket / cloud name', type: 'text', required: true },
      { key: 'region', label: 'Region', type: 'text', hint: 'eu-west-1' },
      { key: 'access_key', label: 'Access key ID', type: 'text' },
      { key: 'secret_key', label: 'Secret access key', type: 'secret', required: true },
    ],
  },
  {
    id: 'payments',
    category: 'Payments',
    title: 'Payments (Mobile Money and card)',
    description: 'Hostel bookings, marketplace fees and premium plans.',
    fields: [
      { key: 'provider', label: 'Provider', type: 'dropdown', required: true, options: ['Paystack', 'Hubtel', 'Flutterwave'], default: 'Paystack' },
      { key: 'public_key', label: 'Public key', type: 'text' },
      { key: 'secret_key', label: 'Secret key', type: 'secret', required: true },
      { key: 'webhook_secret', label: 'Webhook secret', type: 'secret' },
    ],
  },
  {
    id: 'oauth',
    category: 'Sign-in',
    title: 'Google and GitHub sign-in',
    description: 'Lets students sign in with their existing accounts.',
    fields: [
      { key: 'google_client_id', label: 'Google client ID', type: 'text', required: true },
      { key: 'google_client_secret', label: 'Google client secret', type: 'secret', required: true },
      { key: 'github_client_id', label: 'GitHub client ID', type: 'text' },
      { key: 'github_client_secret', label: 'GitHub client secret', type: 'secret' },
    ],
  },
];

export const defById = (id: string): IntegrationDef | undefined => CATALOG.find((d) => d.id === id);

/** Modules switchable from System. */
export const DEFAULT_FLAGS = [
  { key: 'hostels', label: 'Hostels', description: 'Hostel listings and enquiries', enabled: 1 },
  { key: 'market', label: 'Marketplace', description: 'Student buying and selling', enabled: 1 },
  { key: 'jobs', label: 'Opportunities', description: 'Jobs, internships and gigs', enabled: 1 },
  { key: 'attendance', label: 'QR attendance', description: 'Club and class check-in by QR code', enabled: 1 },
  { key: 'community', label: 'Community feed', description: 'Student posts and discussions', enabled: 1 },
  { key: 'ai', label: 'AI tools', description: 'Also needs the AI module connected under Integrations', enabled: 0 },
];
