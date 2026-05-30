import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NameListInput } from "./NameListInput";
import { FixedGridInput } from "./FixedGridInput";

interface GrandIntroTabProps {
  eventType: string;
  grandIntro: any;
  setGrandIntro: (value: any) => void;
}

export const GrandIntroTab = ({ eventType, grandIntro, setGrandIntro }: GrandIntroTabProps) => {
  if (eventType === 'wedding') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Grand Introduction</CardTitle>
          <CardDescription>Order and names for the grand entrance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FixedGridInput
            label="Grandparents of the Bride"
            placeholder="Grandparent"
            values={grandIntro.grandparents_bride || []}
            count={4}
            onChange={(v) => setGrandIntro({ ...grandIntro, grandparents_bride: v })}
          />
          <FixedGridInput
            label="Grandparents of the Groom"
            placeholder="Grandparent"
            values={grandIntro.grandparents_groom || []}
            count={4}
            onChange={(v) => setGrandIntro({ ...grandIntro, grandparents_groom: v })}
          />
          <FixedGridInput
            label="Parents of the Bride"
            placeholder="Parent"
            values={grandIntro.parents_bride || []}
            count={4}
            onChange={(v) => setGrandIntro({ ...grandIntro, parents_bride: v })}
          />
          <FixedGridInput
            label="Parents of the Groom"
            placeholder="Parent"
            values={grandIntro.parents_groom || []}
            count={4}
            onChange={(v) => setGrandIntro({ ...grandIntro, parents_groom: v })}
          />
          <NameListInput
            label="Bridesmaids"
            placeholder="Bridesmaid"
            names={grandIntro.bridesmaids || ['']}
            onChange={(names) => setGrandIntro({ ...grandIntro, bridesmaids: names })}
          />
          <NameListInput
            label="Groomsmen"
            placeholder="Groomsman"
            names={grandIntro.groomsmen || ['']}
            onChange={(names) => setGrandIntro({ ...grandIntro, groomsmen: names })}
          />
          <div>
            <Label>Introduced As</Label>
            <Input
              placeholder="e.g., Mr. & Mrs. Smith"
              value={grandIntro.announcement_line || ''}
              onChange={(e) => setGrandIntro({ ...grandIntro, announcement_line: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (eventType === 'quince') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Court Introduction</CardTitle>
          <CardDescription>Names and order for the Court of Honor entrance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Chambelán de Honor</Label>
            <Input
              placeholder="Main escort name"
              value={grandIntro.chambelan_de_honor || ''}
              onChange={(e) => setGrandIntro({ ...grandIntro, chambelan_de_honor: e.target.value })}
            />
          </div>
          <NameListInput
            label="Padrinos"
            placeholder="Padrino/Madrina"
            names={grandIntro.padrinos || ['']}
            onChange={(names) => setGrandIntro({ ...grandIntro, padrinos: names })}
            addLabel="Add Padrino/Madrina"
          />
          <NameListInput
            label="Damas"
            placeholder="Dama"
            names={grandIntro.damas || ['']}
            onChange={(names) => setGrandIntro({ ...grandIntro, damas: names })}
          />
          <NameListInput
            label="Chambelanes"
            placeholder="Chambelán"
            names={grandIntro.chambelanes || ['']}
            onChange={(names) => setGrandIntro({ ...grandIntro, chambelanes: names })}
            addLabel="Add Chambelán"
          />
          <div>
            <Label>Introduced As</Label>
            <Input
              placeholder="e.g., La Quinceañera, Sofia Martinez"
              value={grandIntro.announcement_line || ''}
              onChange={(e) => setGrandIntro({ ...grandIntro, announcement_line: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
