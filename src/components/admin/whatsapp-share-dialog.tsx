'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
  /** If provided, opens WhatsApp directly to this phone number (with country code). Otherwise opens WhatsApp without a recipient (user picks the group). */
  phone?: string | null;
  title?: string;
  description?: string;
  onDone?: () => void;
}

export function WhatsAppShareDialog({
  open,
  onOpenChange,
  message,
  phone,
  title = 'Share via WhatsApp',
  description = 'Copy the message and send it to your candidates group.',
  onDone,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message);

  // Reset when dialog opens with new message
  if (open && editedMessage !== message && !copied) {
    // only reset if user hasn't started editing
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildWhatsAppUrl = () => {
    const encoded = encodeURIComponent(editedMessage);
    if (phone) {
      // Clean phone: remove non-digits, ensure country code
      const cleaned = phone.replace(/\D/g, '');
      const withCountry = cleaned.length === 10 ? `91${cleaned}` : cleaned;
      return `https://wa.me/${withCountry}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  };

  const handleOpenWhatsApp = async () => {
    await navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    window.open(buildWhatsAppUrl(), '_blank');
  };

  const handleClose = () => {
    onOpenChange(false);
    setCopied(false);
    setEditedMessage(message);
    onDone?.();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
            </div>
            {title}
          </DialogTitle>
          <DialogDescription>
            {phone ? 'Click "Open WhatsApp" to message this candidate directly.' : description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Message preview (you can edit)
            </label>
            <Textarea
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              rows={10}
              className="text-sm font-mono resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex-1 gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Message'}
            </Button>
            <Button
              onClick={handleOpenWhatsApp}
              className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <ExternalLink className="w-4 h-4" />
              Open WhatsApp
            </Button>
          </div>

          {!phone && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              WhatsApp will open and you'll pick your candidates group to paste the message.
            </p>
          )}

          <Button variant="ghost" size="sm" onClick={handleClose} className="w-full">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
