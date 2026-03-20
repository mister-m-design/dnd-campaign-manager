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
        const characters = await prisma.character.findMany({
            orderBy: { updatedAt: 'desc' }
        });

        // Parse stringified JSON fields back to objects
        const parsedCharacters = characters.map(char => ({
            ...char,
            image: char.image,
            details: char.details ? JSON.parse(char.details) : {},
            inventory: char.inventory ? JSON.parse(char.inventory) : [],
            spells: char.spells ? JSON.parse(char.spells) : []
        }));

        return NextResponse.json(parsedCharacters);
    } catch (error) {
        console.error("Failed to fetch characters:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await ensureDefaultUser();
        const data = await request.json();

        if (!data.id || !data.name) {
            return NextResponse.json({ error: "Invalid record data" }, { status: 400 });
        }

        const character = await prisma.character.upsert({
            where: { id: data.id },
            update: {
                name: data.name,
                race: data.race || "Unknown",
                class: data.class || "Unknown",
                level: data.level || 1,
                background: data.background || "None",
                alignment: data.alignment || "Neutral",
                strength: data.strength || 10,
                dexterity: data.dexterity || 10,
                constitution: data.constitution || 10,
                intelligence: data.intelligence || 10,
                wisdom: data.wisdom || 10,
                charisma: data.charisma || 10,
                currentHp: data.currentHp || 10,
                maxHp: data.maxHp || 10,
                tempHp: data.tempHp || 0,
                ac: data.ac || 10,
                initiative: data.initiative || 0,
                speed: data.speed || 30,
                image: data.image || null,
                details: data.details ? JSON.stringify(data.details) : "{}",
                inventory: data.inventory ? JSON.stringify(data.inventory) : "[]",
                spells: data.spells ? JSON.stringify(data.spells) : "[]",
                campaignId: data.campaignId || null
            },
            create: {
                id: data.id,
                ownerId: DEFAULT_USER_ID,
                name: data.name,
                race: data.race || "Unknown",
                class: data.class || "Unknown",
                level: data.level || 1,
                background: data.background || "None",
                alignment: data.alignment || "Neutral",
                strength: data.strength || 10,
                dexterity: data.dexterity || 10,
                constitution: data.constitution || 10,
                intelligence: data.intelligence || 10,
                wisdom: data.wisdom || 10,
                charisma: data.charisma || 10,
                currentHp: data.currentHp || 10,
                maxHp: data.maxHp || 10,
                tempHp: data.tempHp || 0,
                ac: data.ac || 10,
                initiative: data.initiative || 0,
                speed: data.speed || 30,
                image: data.image || null,
                details: data.details ? JSON.stringify(data.details) : "{}",
                inventory: data.inventory ? JSON.stringify(data.inventory) : "[]",
                spells: data.spells ? JSON.stringify(data.spells) : "[]",
                campaignId: data.campaignId || null
            }
        });

        return NextResponse.json(character);
    } catch (error) {
        console.error("Failed to save character:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await prisma.character.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete character:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
