import { NextRequest, NextResponse } from 'next/server';
import { CrmService } from '@/services/crm.service';
import { PromotionService } from '@/services/promotion.service';

export async function GET() {
  try {
    const crmData = await CrmService.getCrmDashboardMetrics();
    const promoAnalytics = await PromotionService.getPromotionAnalytics();

    return NextResponse.json({
      success: true,
      crm: crmData,
      promotions: promoAnalytics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal memuat metrik CRM' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;
    const { targetSegment, discountPercent, campaignName } = body;

    if (!targetSegment || !discountPercent) {
      return NextResponse.json(
        { success: false, error: 'Target segmen dan persentase diskon wajib diisi' },
        { status: 400 }
      );
    }

    const campaign = await CrmService.triggerRetentionCampaign({
      targetSegment,
      discountPercent: Number(discountPercent),
      campaignName,
    });

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengirim aksi retensi CRM' },
      { status: 500 }
    );
  }
}
