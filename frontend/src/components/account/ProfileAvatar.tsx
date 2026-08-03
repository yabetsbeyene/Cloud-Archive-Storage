import { useEffect, useState } from 'react'
import { accountApi } from '@/api/account.api'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface ProfileAvatarProps {
  userSub?: string
  name: string
  profilePictureUpdatedAt?: string | null
  size?: AvatarSize
  className?: string
}

const sizes: Record<AvatarSize, string> = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-base',
  xl: 'size-24 text-2xl',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return `${parts[0][0]}${parts.length > 1 ? parts.at(-1)![0] : ''}`.toUpperCase()
}

export function ProfileAvatar({
  userSub,
  name,
  profilePictureUpdatedAt,
  size = 'md',
  className = '',
}: ProfileAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!profilePictureUpdatedAt) {
      setImageUrl(null)
      return
    }

    let active = true
    let objectUrl: string | null = null
    accountApi
      .getProfilePicture(userSub)
      .then((blob) => {
        if (!active) return
        objectUrl = URL.createObjectURL(blob)
        setImageUrl(objectUrl)
      })
      .catch(() => {
        if (active) setImageUrl(null)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [profilePictureUpdatedAt, userSub])

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-indigo-100 font-semibold text-indigo-700 ring-2 ring-white dark:bg-indigo-950 dark:text-indigo-200 dark:ring-slate-900 ${sizes[size]} ${className}`}
      aria-label={`${name}'s profile picture`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  )
}
