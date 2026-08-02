import { useState } from 'react'
import { format } from 'date-fns'
import { Loader2, Plus, Trash2, AlertTriangle } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { NativeSelect } from '#/components/ui/native-select'
import { Textarea } from '#/components/ui/textarea'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import {
  useSaveTruck, parseStatus, encodeStatus, parseIncidents, isExpired,
  STATUS_RATINGS, type StatusRating, type Incident, type FleetTruck,
} from '#/lib/hooks/useFleet'

/** A labelled field; `warn` flags a lapsed compliance date. */
function Field({
  label, value, onChange, type = 'text', warn, placeholder, span,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  warn?: boolean
  placeholder?: string
  span?: boolean
}) {
  return (
    <div className={cn('space-y-1.5', span && 'sm:col-span-2')}>
      <label className={cn(MICRO, 'flex items-center gap-1.5 text-muted-foreground')}>
        {label}
        {warn && <AlertTriangle className="size-3 text-warning" aria-label="Expired" />}
      </label>
      <Input
        type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={warn || undefined}
      />
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className={cn(MICRO, 'border-b border-foreground/10 pb-2 text-muted-foreground')}>
        {title}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

const iso = (v?: string | null) => (v ? String(v).slice(0, 10) : '')

export function TruckDialog({
  truck, open, onOpenChange,
}: {
  truck: FleetTruck | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const save = useSaveTruck()
  const status = parseStatus(truck?.truckStatus)

  const blank = {
    plateNumber: truck?.plateNumber ?? '',
    chassisNumber: truck?.chassisNumber ?? '',
    truckMake: truck?.truckMake ?? '',
    driverName: truck?.driverName ?? '',
    driverPhone: truck?.driverPhone ?? '',
    driverAltPhone: truck?.driverAltPhone ?? '',
    motorBoyName: truck?.motorBoyName ?? '',
    motorBoyPhone: truck?.motorBoyPhone ?? '',
    spareDriverName: truck?.spareDriverName ?? '',
    spareDriverPhone: truck?.spareDriverPhone ?? '',
    passportPhoto: truck?.passportPhoto ?? '',
    maxCapacity: truck?.maxCapacity != null ? String(truck.maxCapacity) : '',
    fuelCapacity: truck?.fuelCapacity != null ? String(truck.fuelCapacity) : '',
    avgLitresPerTrip: truck?.avgLitresPerTrip != null ? String(truck.avgLitresPerTrip) : '',
    mileage: truck?.mileage != null ? String(truck.mileage) : '',
    insuranceExpiry: iso(truck?.insuranceExpiry),
    roadWorthinessExpiry: iso(truck?.roadWorthinessExpiry),
    lastServiceDate: iso(truck?.lastServiceDate),
    nextServiceDate: iso(truck?.nextServiceDate),
    notes: truck?.notes ?? '',
  }

  const [form, setForm] = useState(blank)
  const [rating, setRating] = useState<StatusRating>(status.rating)
  const [reason, setReason] = useState(status.reason)
  const [incidents, setIncidents] = useState<Incident[]>(parseIncidents(truck?.incidents))
  const [draft, setDraft] = useState<Incident>({ date: format(new Date(), 'yyyy-MM-dd'), description: '' })

  // Re-seed when a different truck is opened.
  const key = truck?.id ?? 'new'
  const [seeded, setSeeded] = useState(key)
  if (seeded !== key) {
    setSeeded(key)
    setForm(blank)
    setRating(status.rating)
    setReason(status.reason)
    setIncidents(parseIncidents(truck?.incidents))
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  // Only these two are required; everything else is optional by design.
  const ready = form.plateNumber.trim() && form.driverName.trim()

  const submit = async () => {
    const num = (v: string) => (v.trim() === '' ? null : Number(v))
    await save.mutateAsync({
      id: truck?.id,
      data: {
        ...form,
        maxCapacity: num(form.maxCapacity),
        fuelCapacity: num(form.fuelCapacity),
        avgLitresPerTrip: num(form.avgLitresPerTrip),
        mileage: num(form.mileage),
        insuranceExpiry: form.insuranceExpiry || null,
        roadWorthinessExpiry: form.roadWorthinessExpiry || null,
        lastServiceDate: form.lastServiceDate || null,
        nextServiceDate: form.nextServiceDate || null,
        // Rating and reason are packed back into one column.
        truckStatus: encodeStatus(rating, reason),
        incidents: JSON.stringify(incidents),
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{truck ? `Edit ${truck.plateNumber}` : 'Add truck'}</DialogTitle>
          <DialogDescription>Only the plate and driver name are required.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Group title="Identity">
            <Field label="Plate number" value={form.plateNumber} onChange={(v) => set('plateNumber', v)} />
            <Field label="Truck make" value={form.truckMake} onChange={(v) => set('truckMake', v)} />
            <Field label="Chassis number" value={form.chassisNumber} onChange={(v) => set('chassisNumber', v)} span />
          </Group>

          <Group title="People">
            <Field label="Driver's name" value={form.driverName} onChange={(v) => set('driverName', v)} />
            <Field label="Driver's phone" value={form.driverPhone} onChange={(v) => set('driverPhone', v)} />
            <Field label="Driver alt phone" value={form.driverAltPhone} onChange={(v) => set('driverAltPhone', v)} />
            <Field label="Motor boy" value={form.motorBoyName} onChange={(v) => set('motorBoyName', v)} />
            <Field label="Motor boy phone" value={form.motorBoyPhone} onChange={(v) => set('motorBoyPhone', v)} />
            <Field label="Spare driver" value={form.spareDriverName} onChange={(v) => set('spareDriverName', v)} />
            <Field label="Spare driver phone" value={form.spareDriverPhone} onChange={(v) => set('spareDriverPhone', v)} />
            <Field label="Passport photo URL" value={form.passportPhoto} onChange={(v) => set('passportPhoto', v)} span />
          </Group>

          <Group title="Condition">
            <div className="space-y-1.5">
              <label className={cn(MICRO, 'block text-muted-foreground')}>Rating</label>
              <NativeSelect value={rating} onChange={(e) => setRating(e.target.value as StatusRating)}>
                {STATUS_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <label className={cn(MICRO, 'block text-muted-foreground')}>Reason</label>
              <Input
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder={rating === 'Excellent' || rating === 'Good' ? 'Not needed' : 'e.g. no tyres'}
                disabled={rating === 'Excellent' || rating === 'Good'}
              />
              {(rating === 'Excellent' || rating === 'Good') && (
                <p className="text-xs text-muted-foreground/70">
                  A reason is only kept for Fair and Bad.
                </p>
              )}
            </div>
          </Group>

          <Group title="Capacity & notes">
            <Field label="Max capacity" type="number" value={form.maxCapacity} onChange={(v) => set('maxCapacity', v)} />
            <Field label="Fuel capacity" type="number" value={form.fuelCapacity} onChange={(v) => set('fuelCapacity', v)} />
            <Field label="Avg litres per trip" type="number" value={form.avgLitresPerTrip} onChange={(v) => set('avgLitresPerTrip', v)} />
            <Field label="Mileage" type="number" value={form.mileage} onChange={(v) => set('mileage', v)} />
            <div className="space-y-1.5 sm:col-span-2">
              <label className={cn(MICRO, 'block text-muted-foreground')}>Notes</label>
              <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </Group>

          <Group title="Compliance">
            <Field
              label="Insurance expiry" type="date" value={form.insuranceExpiry}
              onChange={(v) => set('insuranceExpiry', v)} warn={isExpired(form.insuranceExpiry)}
            />
            <Field
              label="Road worthiness expiry" type="date" value={form.roadWorthinessExpiry}
              onChange={(v) => set('roadWorthinessExpiry', v)} warn={isExpired(form.roadWorthinessExpiry)}
            />
            <Field label="Last service" type="date" value={form.lastServiceDate} onChange={(v) => set('lastServiceDate', v)} />
            <Field label="Next service" type="date" value={form.nextServiceDate} onChange={(v) => set('nextServiceDate', v)} />
          </Group>

          <div className="space-y-3">
            <p className={cn(MICRO, 'border-b border-foreground/10 pb-2 text-muted-foreground')}>
              Incidents
            </p>
            {incidents.length > 0 && (
              <ul className="space-y-2">
                {incidents.map((inc, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-foreground/15 p-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground tabular-nums">{inc.date}</p>
                      <p className="text-sm">{inc.description}</p>
                    </div>
                    <Button
                      variant="ghost" size="icon-sm"
                      onClick={() => setIncidents((l) => l.filter((_, j) => j !== i))}
                    >
                      <Trash2 /><span className="sr-only">Remove incident</span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <Input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))} />
              <Input
                placeholder="What happened" value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              />
              <Button
                variant="outline" size="sm"
                disabled={!draft.description.trim()}
                onClick={() => {
                  setIncidents((l) => [...l, draft])
                  setDraft({ date: format(new Date(), 'yyyy-MM-dd'), description: '' })
                }}
              >
                <Plus data-icon="inline-start" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!ready || save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />}
            {truck ? 'Save changes' : 'Add truck'}
          </Button>
        </DialogFooter>
        {!ready && (
          <p className="text-right text-xs text-muted-foreground/70">
            Plate number and driver name are required
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
