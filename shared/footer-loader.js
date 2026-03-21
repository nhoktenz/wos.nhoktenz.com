async function loadSharedFooter() {
    const footer = document.getElementById('sharedFooter');
    if (!footer) {
        return;
    }

    try {
        const response = await fetch('../shared/footer.html', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to load footer');
        }
        footer.innerHTML = await response.text();
    } catch (error) {
        footer.innerHTML = '<p>Created by <strong>[ADT]『ᴺʰᵒˣᴛᴇɴᴢᴬᴰᵀ༒天ヅ』- 2608</strong></p><p>Made for the Whiteout Survival community ❄️⚔️</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadSharedFooter);
