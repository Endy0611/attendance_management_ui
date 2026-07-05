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
  UserIcon, MailIcon, PhoneIcon, IdCardIcon, GraduationCapIcon,
  ShieldCheckIcon, CalendarIcon, KeyRoundIcon, LoaderIcon, PencilIcon, XIcon,
  CameraIcon, ZoomInIcon, ZoomOutIcon
} from "lucide-react"
import Link from "next/link"

const NAVY = "#1C4D8D"

const ROLE_META: Record<string, { label: string; color: string }> = {
  ADMIN:      { label: "Admin",      color: "bg-rose-100 text-rose-700" },
  INSTRUCTOR: { label: "Instructor", color: "bg-amber-100 text-amber-700" },
  STUDENT:    { label: "Student",    color: "bg-sky-100 text-sky-700" },
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

export function ProfileManager({ initialUser }: { initialUser: AppUserResponse }) {
  const [user, setUser] = useState(initialUser)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(initialUser.avatar ?? undefined)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setStoreUser = useAuthStore((s) => s.setUser)

  // Crop State Hooks
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

  const roleMeta = ROLE_META[user.role] ?? ROLE_META.STUDENT

  // Accepts string | undefined and always returns undefined (never "") when
  // there's nothing to show — an empty string src on <img> triggers a React
  // warning and can make the browser re-fetch the current page.
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
        // fall through to the generic cases below
      }
    }

    if (avatarValue.startsWith("http://") || avatarValue.startsWith("https://")) {
      return avatarValue
    }

    return `${process.env.NEXT_PUBLIC_API_URL}/files/preview-file?key=${avatarValue}`
  }

  // Handle local file picking -> Trigger Cropping Modal UI
  function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result as string)
    })
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((croppedArea: any, accomplishedPixels: any) => {
    setCroppedAreaPixels(accomplishedPixels)
  }, [])

  // Process the final user zoom placement context coordinates -> Save upload server action
  async function handleApplyCrop() {
    if (!imageToCrop || !croppedAreaPixels) return
    setUploadingAvatar(true)
    setImageToCrop(null) // dismiss overlay frame interface

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
      toastSuccess("Cropped successfully — save to apply changes")
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
      const targetForm = e.currentTarget
      const formData = new FormData(targetForm)
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

  return (
    <div className="max-w-2xl space-y-6">
      {/* Interactive Floating Crop Backdrop Overlay Window Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 animate-in fade-in">
          <div className="relative w-full max-w-md aspect-square bg-muted rounded-xl overflow-hidden shadow-2xl border">
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

          {/* Zoom Adjust Controls Interface Grid Toolbar */}
          <div className="w-full max-w-md bg-background border mt-4 p-4 rounded-xl flex flex-col gap-4 shadow-xl">
            <div className="flex items-center gap-3 justify-center">
              <Button size="icon" variant="outline" onClick={() => setZoom(Math.max(1, zoom - 0.2))}>
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
                className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-[#1C4D8D]"
              />
              <Button size="icon" variant="outline" onClick={() => setZoom(Math.min(3, zoom + 0.2))}>
                <ZoomInIcon className="size-4" />
              </Button>
            </div>

            <div className="flex gap-2 w-full">
              <Button className="flex-1" style={{ backgroundColor: NAVY }} onClick={handleApplyCrop}>
                Apply Crop
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setImageToCrop(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Identity card */}
      <div className="rounded-2xl border bg-card p-6 flex items-center gap-4">
        <Avatar className="h-16 w-16 rounded-2xl">
          <AvatarImage src={getDisplayAvatar(user.avatar)} alt={user.name} />
          <AvatarFallback className="rounded-2xl text-lg">
            {initialsOf(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-lg font-semibold truncate">{user.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleMeta.color}`}>
              <ShieldCheckIcon className="size-3" /> {roleMeta.label}
            </span>
            {user.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-xs font-medium">
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile details / edit form */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium">Profile details</p>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <PencilIcon className="size-3.5" /> Edit
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar uploader */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 rounded-2xl">
                  <AvatarImage src={getDisplayAvatar(avatarPreview)} alt={user.name} />
                  <AvatarFallback className="rounded-2xl text-lg">
                    {initialsOf(user.name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted disabled:opacity-60"
                  aria-label="Change photo"
                >
                  {uploadingAvatar
                    ? <LoaderIcon className="size-3.5 animate-spin" />
                    : <CameraIcon className="size-3.5" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                JPG or PNG, up to 5MB. Click camera to zoom & crop!
              </div>
              <input type="hidden" name="avatar" value={avatarPreview ?? ""} readOnly />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Full name</label>
                <input
                  name="name"
                  defaultValue={user.name}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user.phone ?? ""}
                  placeholder="95662931"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1C4D8D]/30"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={saving || uploadingAvatar} style={{ backgroundColor: NAVY }}>
                {saving ? <LoaderIcon className="size-4 animate-spin" /> : null}
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>
                <XIcon className="size-4" /> Cancel
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 text-sm">
            <Field icon={<UserIcon className="size-4" />} label="Full name" value={user.name} />
            <Field icon={<MailIcon className="size-4" />} label="Email" value={user.email} />
            <Field icon={<PhoneIcon className="size-4" />} label="Phone" value={user.phone || "—"} />
            {user.studentId && (
              <Field icon={<IdCardIcon className="size-4" />} label="Student ID" value={user.studentId} />
            )}
            {user.generation != null && (
              <Field icon={<GraduationCapIcon className="size-4" />} label="Generation" value={`Gen ${user.generation}`} />
            )}
            <Field
              icon={<CalendarIcon className="size-4" />}
              label="Member since"
              value={new Date(user.createdAt).toLocaleDateString()}
            />
          </dl>
        )}
      </div>

      {/* Security */}
      <div className="rounded-2xl border bg-card p-6 space-y-3">
        <p className="font-medium">Security</p>
        <p className="text-sm text-muted-foreground">
          Change your password to keep your account secure.
        </p>
        <Button variant="outline" asChild>
          <Link href="/change-password">
            <KeyRoundIcon className="size-4" /> Change password
          </Link>
        </Button>
      </div>
    </div>
  )
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  )
}