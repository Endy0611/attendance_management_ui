"use client"

import { useRef, useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import { updateProfileServerAction } from "@/actions/auth-server.action"
import { uploadAvatarServerAction } from "@/actions/file-server.action"
import { useAuthStore } from "@/store/auth.store"
import { toastSuccess, toastError } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { AppUserResponse } from "@/types/auth-types"
import {
  MailIcon, PhoneIcon, IdCardIcon, GraduationCapIcon,
  ShieldCheckIcon, CalendarIcon, KeyRoundIcon, LoaderIcon, PencilIcon, XIcon,
  CameraIcon, ZoomInIcon, ZoomOutIcon, CheckCircle2Icon, ChevronRightIcon,
  CheckIcon, UserIcon
} from "lucide-react"
import Link from "next/link"

const NAVY = "#1C4D8D"

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  INSTRUCTOR: "Instructor",
  STUDENT: "Student",
}

const ROLE_ICON: Record<string, typeof ShieldCheckIcon> = {
  ADMIN: ShieldCheckIcon,
  INSTRUCTOR: GraduationCapIcon,
  STUDENT: UserIcon,
}

function initialsOf(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "U"
}

// ─── CANVAS UTILITY: Crops the image to match the user's zoom ──────────────
async function getCroppedImg(imageSrc: string, pixelCrop: { x: number; y: number; width: number; height: number }): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.setAttribute("crossOrigin", "anonymous")
    img.src = imageSrc
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(err)
  })

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No 2d context")

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Canvas is empty"))
      const croppedFile = new File([blob], "avatar.png", { type: "image/png" })
      resolve(croppedFile)
    }, "image/png")
  })
}

type Tab = "profile" | "security"

export function ProfileManager({ initialUser }: { initialUser: AppUserResponse }) {
  const [user, setUser] = useState(initialUser)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>("profile")
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initialUser.avatar ?? undefined)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setStoreUser = useAuthStore((s) => s.setUser)

  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const roleLabel = ROLE_LABEL[user.role] ?? ROLE_LABEL.STUDENT
  const RoleIcon = ROLE_ICON[user.role] ?? ROLE_ICON.STUDENT

  const getDisplayAvatar = (avatarValue?: string): string | undefined => {
    if (!avatarValue || avatarValue.trim() === "") return undefined
    if (avatarValue.includes("key=")) {
      try {
        if (avatarValue.startsWith("http")) {
          const urlObj = new URL(avatarValue)
          const keyParam = urlObj.searchParams.get("key")
          if (keyParam) return `${process.env.NEXT_PUBLIC_API_URL}/files/preview-file?key=${keyParam}`
        }
      } catch {
        // fall through
      }
    }
    if (avatarValue.startsWith("http://") || avatarValue.startsWith("https://")) return avatarValue
    return `${process.env.NEXT_PUBLIC_API_URL}/files/preview-file?key=${avatarValue}`
  }

  function pickAvatarFile() {
    fileInputRef.current?.click()
  }

  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result as string)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    })
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_area: any, pixels: any) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleApplyCrop() {
    if (!imageToCrop || !croppedAreaPixels) return
    setUploadingAvatar(true)
    setImageToCrop(null)

    try {
      const croppedFile = await getCroppedImg(imageToCrop, croppedAreaPixels)
      const body = new FormData()
      body.append("file", croppedFile)

      const result = await uploadAvatarServerAction(body)
      if (!result.ok) {
        toastError(result.error)
        return
      }

      setAvatarPreview(result.data.fileUrl)
      setEditing(true)
      toastSuccess("Photo ready — save to apply")
    } catch (err) {
      toastError("Failed to process the cropped image")
    } finally {
      setUploadingAvatar(false)
      setZoom(1)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData(e.currentTarget)
      formData.set("avatar", avatarPreview ?? "")

      const result = await updateProfileServerAction(formData)
      setSaving(false)

      if (!result.ok) {
        toastError(result.error)
        return
      }

      setUser(result.data)
      setAvatarPreview(result.data.avatar ?? undefined)
      setStoreUser(result.data)
      toastSuccess("Profile updated")
      setEditing(false)
    } catch (err) {
      setSaving(false)
      toastError("Unexpected error while saving")
    }
  }

  function cancelEdit() {
    setAvatarPreview(user.avatar ?? undefined)
    setEditing(false)
  }

  const details = [
    { icon: MailIcon, label: "Email", value: user.email },
    { icon: PhoneIcon, label: "Phone", value: user.phone || "Not set" },
    ...(user.studentId ? [{ icon: IdCardIcon, label: "Student ID", value: user.studentId }] : []),
    ...(user.generation != null ? [{ icon: GraduationCapIcon, label: "Generation", value: `Gen ${user.generation}` }] : []),
    { icon: CalendarIcon, label: "Member since", value: new Date(user.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="max-w-4xl animate-in fade-in duration-500">
      {/* Crop modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md aspect-square bg-muted rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="w-full max-w-md bg-card border mt-4 p-4 sm:p-5 rounded-3xl flex flex-col gap-4 shadow-xl ring-1 ring-black/[0.03] animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 justify-center">
              <Button size="icon" variant="outline" className="rounded-full shrink-0" onClick={() => setZoom(Math.max(1, zoom - 0.2))}>
                <ZoomOutIcon className="size-4" />
              </Button>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                aria-label="Zoom scale factor"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-[#1C4D8D]"
              />
              <Button size="icon" variant="outline" className="rounded-full shrink-0" onClick={() => setZoom(Math.min(3, zoom + 0.2))}>
                <ZoomInIcon className="size-4" />
              </Button>
            </div>
            <div className="flex gap-2 w-full">
              <Button className="flex-1 transition-transform active:scale-[0.98]" style={{ backgroundColor: NAVY }} onClick={handleApplyCrop}>
                <CheckIcon className="size-4" /> Apply crop
              </Button>
              <Button variant="outline" className="flex-1 transition-transform active:scale-[0.98]" onClick={() => setImageToCrop(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No page heading here — the parent page already renders
          "Profile Settings" above this component. */}

      {/* No banner block anymore — a flat two-column layout instead. Left
          rail is a quiet identity card that stays put; right side is where
          things change (tabs, forms). Nothing overlaps or gets clipped. */}
      <div className="grid gap-5 lg:grid-cols-[240px_1fr] items-start">
        {/* Identity rail */}
        <div className="rounded-3xl border bg-card shadow-sm ring-1 ring-black/[0.02] p-6 flex flex-col items-center text-center lg:sticky lg:top-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 rounded-full ring-2 ring-offset-4 ring-offset-card" style={{ ["--tw-ring-color" as any]: `${NAVY}33` }}>
              <AvatarImage src={getDisplayAvatar(avatarPreview)} alt={user.name} className="object-cover" />
              <AvatarFallback className="text-xl" style={{ backgroundColor: `${NAVY}14`, color: NAVY }}>
                {initialsOf(user.name)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={pickAvatarFile}
              disabled={uploadingAvatar}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-card shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: NAVY, color: "white" }}
            >
              {uploadingAvatar ? <LoaderIcon className="size-3.5 animate-spin" /> : <CameraIcon className="size-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
          </div>

          <p className="mt-4 font-semibold font-[family-name:var(--font-display)] truncate max-w-full">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate max-w-full mt-0.5">{user.email}</p>

          <div className="flex items-center gap-1.5 mt-3 flex-wrap justify-center">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ color: NAVY, backgroundColor: `${NAVY}12` }}
            >
              <RoleIcon className="size-3" /> {roleLabel}
            </span>
            {user.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-xs font-medium">
                <CheckCircle2Icon className="size-3" /> Verified
              </span>
            )}
          </div>

          <div className="w-full h-px bg-border my-5" />

          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Member since</p>
          <p className="text-sm font-medium mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Main panel */}
        <div className="rounded-3xl border bg-card shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
          <div className="px-5 sm:px-6 pt-4 flex items-center gap-1 border-b">
            {(["profile", "security"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="relative px-3 py-2.5 text-sm font-medium capitalize transition-colors"
                style={{ color: tab === t ? NAVY : "var(--muted-foreground)" }}
              >
                {t}
                {tab === t && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full" style={{ backgroundColor: NAVY }} />
                )}
              </button>
            ))}
          </div>

          {tab === "profile" && !editing && (
            <div className="animate-in fade-in duration-200">
              <dl>
                {details.map((f, i) => (
                  <div
                    key={f.label}
                    className={`flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 ${i !== 0 ? "border-t" : ""}`}
                  >
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <f.icon className="size-4" />
                      <span className="text-sm">{f.label}</span>
                    </div>
                    <span className="text-sm font-medium text-right truncate max-w-[60%]">{f.value}</span>
                  </div>
                ))}
              </dl>
              <div className="px-5 sm:px-6 py-4 border-t bg-muted/20">
                <Button size="sm" style={{ backgroundColor: NAVY }} onClick={() => setEditing(true)}>
                  <PencilIcon className="size-3.5" /> Edit profile
                </Button>
              </div>
            </div>
          )}

          {tab === "profile" && editing && (
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-16 w-16 rounded-2xl ring-2 ring-border">
                    <AvatarImage src={getDisplayAvatar(avatarPreview)} alt={user.name} className="object-cover" />
                    <AvatarFallback className="rounded-2xl text-lg" style={{ backgroundColor: `${NAVY}14`, color: NAVY }}>
                      {initialsOf(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={pickAvatarFile}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors disabled:opacity-60"
                    aria-label="Change photo"
                  >
                    {uploadingAvatar ? <LoaderIcon className="size-3.5 animate-spin" /> : <CameraIcon className="size-3.5" />}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">JPG or PNG, up to 5MB. Click the camera to zoom &amp; crop.</p>
                <input type="hidden" name="avatar" value={avatarPreview ?? ""} readOnly />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full name</label>
                  <input
                    name="name"
                    defaultValue={user.name}
                    required
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#1C4D8D]/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={user.phone ?? ""}
                    placeholder="95662931"
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-[#1C4D8D]/30"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={saving || uploadingAvatar} className="transition-transform active:scale-[0.98]" style={{ backgroundColor: NAVY }}>
                  {saving ? <LoaderIcon className="size-4 animate-spin" /> : null}
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving} className="transition-transform active:scale-[0.98]">
                  <XIcon className="size-4" /> Cancel
                </Button>
              </div>
            </form>
          )}

          {tab === "security" && (
            <div className="p-5 sm:p-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-4 rounded-2xl border p-4">
                <div className="min-w-0 flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: `${NAVY}12`, color: NAVY }}>
                    <KeyRoundIcon className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium text-sm">Password</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Keep your account protected with a strong password.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="rounded-full shrink-0 transition-transform active:scale-[0.98]" asChild>
                  <Link href="/change-password">
                    Change <ChevronRightIcon className="size-3.5 -mr-1" />
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}