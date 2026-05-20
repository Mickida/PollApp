import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bkkvppcnmufbbavhptvi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJra3ZwcGNubXVmYmJhdmhwdHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNTg4NTUsImV4cCI6MjA5MzYzNDg1NX0.dPK6MAtuF2it8Wz8LzWeTYT9StGbOJ1IjKEOWNeHqNE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
