import { TeamMember } from "@/features/orders/create-order"
import { apiGet } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"

export const useTeams = ({ enabled }: { enabled?: boolean }) => {
  const { data: teamData } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => apiGet<{ data: { members: TeamMember[] } }>('/team'),
    enabled,
  })
  return {
    team: teamData?.data?.members || []
  }
}