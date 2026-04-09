'use client';

import { useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, AlertCircle, Fingerprint } from 'lucide-react';

export default function AttendPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== '') && value) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      submitCode(pasted);
    }
  };

  const submitCode = async (code: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/attendance/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, code }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/c/groundworks/${sessionId}`), 2000);
      } else {
        setError(data.error || 'Invalid or expired code. Try again.');
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setDigits(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-5 shadow-glow animate-[pulse_2s_ease-in-out_infinite]">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Attendance Marked!</h2>
          <p className="text-muted-foreground mt-2">You're all set. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Fingerprint className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter the 6-digit code shown on screen
          </p>
        </div>

        <Card className="shadow-card-hover border-border/60">
          <CardContent className="p-6">
            <div className="flex justify-center gap-2.5 mb-6" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl bg-muted/50 border-border/80 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  disabled={loading}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive mb-4 justify-center bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying code...
              </div>
            )}

            {!loading && !error && (
              <p className="text-center text-xs text-muted-foreground">
                Code auto-submits when all 6 digits are entered
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
