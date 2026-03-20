import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_USER_ID = "local-master-user";

async function ensureDefaultUser() {
    return await prisma.user.upsert({
        where: { id: DEFAULT_USER_ID },
        update: {},
        create: {
            id: DEFAULT_USER_ID,
            name: "Local Master",
            email: "local@mythic.table",
            role: "DM"
        }
    });
}

export async function GET() {
    try {
        await ensureDefaultUser();
        const campaigns = await prisma.campaign.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                sessions: true
            }
        });

        const parsedCampaigns = campaigns.map(c => ({
            ...c,
            partyIds: c.partyIds ? c.partyIds.split(',') : [],
            logs: c.sessions.map(s => ({
                id: s.id,
                date: s.date.toLocaleDateString(),
                title: `Session ${s.number}`,
                content: s.notes || ''
            }))
        }));

        return NextResponse.json(parsedCampaigns);
    } catch (error) {
        console.error("Failed to fetch campaigns:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureDefaultUser();
        const data = await request.json();

        if (!data.id || !data.name) {
            return NextResponse.json({ error: "Invalid campaign data" }, { status: 400 });
        }

        const campaign = await prisma.campaign.upsert({
            where: { id: data.id },
            update: {
                name: data.name,
                description: data.description || null,
                setting: data.setting || "Unknown",
                partyIds: Array.isArray(data.partyIds) ? data.partyIds.join(',') : "",
            },
            create: {
                id: data.id,
                dmId: DEFAULT_USER_ID,
                name: data.name,
                description: data.description || null,
                setting: data.setting || "Unknown",
                partyIds: Array.isArray(data.partyIds) ? data.partyIds.join(',') : "",
            }
        });

        return NextResponse.json(campaign);
    } catch (error) {
        console.error("Failed to save campaign:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
