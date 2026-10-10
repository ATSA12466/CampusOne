import { PageHeader } from "@/components/shared/page-header";
import { Badge, Card } from "@/components/ui";
import { engagementService } from "@/services";

export function AdvertisingFeature() {
  const campaigns = engagementService.listCampaigns();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Advertising management"
        description="Demo campaign manager for homepage promotional placements."
      />
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{campaign.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {campaign.advertiser} • {campaign.placement}
                </p>
                <p className="text-xs text-muted-foreground">
                  {campaign.startDate} to {campaign.endDate}
                </p>
              </div>
              <Badge tone={campaign.status === "active" ? "success" : "warning"}>
                {campaign.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Campaign publishing and billing are demo-only until backend ad operations are integrated.
      </p>
    </div>
  );
}
