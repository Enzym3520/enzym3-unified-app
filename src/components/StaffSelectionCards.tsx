import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Music, Users } from "lucide-react";

export interface StaffMember {
  id: string | null; // null for coordinator (no vendor_id)
  name: string;
  role: "vendor" | "coordinator";
  roleLabel: string;
}

interface StaffSelectionCardsProps {
  staff: StaffMember[];
  onSelect: (member: StaffMember) => void;
}

export const StaffSelectionCards = ({ staff, onSelect }: StaffSelectionCardsProps) => {
  if (staff.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Who would you like to meet with?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a team member to view their availability
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {staff.map((member) => (
          <Card
            key={member.id ?? "coordinator"}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 hover:scale-[1.02]"
            onClick={() => onSelect(member)}
          >
            <CardContent className="flex items-center gap-4 py-6">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {member.role === "vendor" ? (
                    <Music className="h-6 w-6" />
                  ) : (
                    <Users className="h-6 w-6" />
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{member.name}</p>
                <p className="text-sm text-muted-foreground">{member.roleLabel}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
