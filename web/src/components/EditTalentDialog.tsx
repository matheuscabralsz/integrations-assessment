import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateTalent } from '@/api';
import type { TalentRow, Talent, Status } from '@/types';

const STATUS_OPTIONS: Status[] = ['Active', 'Inactive', 'DoNotContact'];

type Form = Pick<
  Talent,
  'firstName' | 'lastName' | 'emailAddress' | 'mobilePhone' | 'status' | 'city' | 'state'
>;

function toForm(row: TalentRow): Form {
  return {
    firstName: row.firstName,
    lastName: row.lastName,
    emailAddress: row.emailAddress,
    mobilePhone: row.mobilePhone,
    status: row.status,
    city: row.city,
    state: row.state,
  };
}

function buildPatch(initial: Form, current: Form): Partial<Talent> {
  const patch: Partial<Talent> = {};
  if (initial.firstName !== current.firstName) patch.firstName = current.firstName;
  if (initial.lastName !== current.lastName) patch.lastName = current.lastName;
  if (initial.emailAddress !== current.emailAddress) patch.emailAddress = current.emailAddress;
  if (initial.mobilePhone !== current.mobilePhone) patch.mobilePhone = current.mobilePhone;
  if (initial.status !== current.status) patch.status = current.status;
  if (initial.city !== current.city) patch.city = current.city;
  if (initial.state !== current.state) patch.state = current.state;

  if (patch.firstName !== undefined || patch.lastName !== undefined) {
    patch.firstName = current.firstName;
    patch.lastName = current.lastName;
  }
  if (patch.city !== undefined || patch.state !== undefined) {
    patch.city = current.city;
    patch.state = current.state;
  }
  return patch;
}

export function EditTalentDialog({
  row,
  open,
  onOpenChange,
  onSaved,
}: {
  row: TalentRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: TalentRow) => void;
}) {
  const initial = toForm(row);
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    const patch = buildPatch(initial, form);
    if (Object.keys(patch).length === 0) {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTalent(row.source, row.id, patch);
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Edit talent <span className="text-xs text-muted-foreground font-mono">({row.source}:{row.id})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={e => update('firstName', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={e => update('lastName', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emailAddress">Email</Label>
            <Input
              id="emailAddress"
              type="email"
              value={form.emailAddress}
              onChange={e => update('emailAddress', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mobilePhone">Phone</Label>
            <Input
              id="mobilePhone"
              value={form.mobilePhone}
              onChange={e => update('mobilePhone', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={v => update('status', v as Status)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={e => update('city', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={form.state}
                onChange={e => update('state', e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Save failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
