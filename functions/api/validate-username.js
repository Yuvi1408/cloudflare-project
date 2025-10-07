// This will be replaced with a real database in a real app
const users = new Map();
users.set("existinguser", { username: "existinguser" });

export async function onRequestPost(context) {
    const { username } = await context.request.json();

    if (!username) {
        return new Response(JSON.stringify({ available: false, message: "Username is required." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const isTaken = users.has(username.toLowerCase());
    return new Response(JSON.stringify({ available: !isTaken }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}