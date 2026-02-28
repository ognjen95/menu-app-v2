'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { TeamMember } from '../types'

const STAFF_STORAGE_KEY = 'pos-selected-staff'

type UseTeamStateProps = {
  team: TeamMember[]
  isOpen: boolean
}

export function useTeamState({ team, isOpen }: UseTeamStateProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  // Preselect current user or from localStorage when dialog opens
  useEffect(() => {
    if (!isOpen || team.length === 0 || selectedUserId) return

    const initializeStaff = async () => {
      // First try localStorage
      const saved = localStorage.getItem(STAFF_STORAGE_KEY)
      if (saved && team.some(m => m.user_id === saved)) {
        setSelectedUserId(saved)
        return
      }

      // Then try current user
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.id) {
        const currentMember = team.find(m => m.user_id === user.id)
        if (currentMember) {
          setSelectedUserId(currentMember.user_id)
          return
        }
      }

      // Fallback to first team member
      if (team.length > 0) {
        setSelectedUserId(team[0].user_id)
      }
    }

    initializeStaff()
  }, [isOpen, team, selectedUserId])

  // Save to localStorage when changed
  useEffect(() => {
    if (selectedUserId) {
      localStorage.setItem(STAFF_STORAGE_KEY, selectedUserId)
    }
  }, [selectedUserId])

  const handleStaffChange = useCallback((userId: string) => {
    setSelectedUserId(userId)
  }, [])

  const selectedStaff = team.find(m => m.user_id === selectedUserId)

  return {
    team,
    selectedUserId,
    selectedStaff,
    setSelectedUserId: handleStaffChange,
  }
}
