const FALLBACK_JSON_URL = 'products.json';

function normalizeProduct(raw, index) {
    return {
        id: raw.id || String(index + 1),
        name: raw.name || `Presente ${index + 1}`,
        emoji: raw.emoji || '🎁',
        image: raw.image || '',
        priceLabel: raw.price || ''
    };
}

async function fetchProductsData() {
    const fallbackResponse = await fetch(FALLBACK_JSON_URL, { cache: 'no-store' });
    if (!fallbackResponse.ok) {
        throw new Error(`Products JSON failed (${fallbackResponse.status})`);
    }

    const fallbackPayload = await fallbackResponse.json();
    return fallbackPayload.products || [];
}

function renderProduct(gallery, product) {
    const item = document.createElement('article');
    item.className = 'product-item';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image';

    if (product.image) {
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = product.name;
        image.className = 'product-image-img';
        image.addEventListener('error', () => {
            image.remove();
            imageContainer.textContent = product.emoji;
        });
        imageContainer.appendChild(image);
    } else {
        imageContainer.textContent = product.emoji;
    }

    const title = document.createElement('h3');
    title.textContent = product.name;

    item.appendChild(imageContainer);
    item.appendChild(title);

    if (product.priceLabel) {
        const price = document.createElement('p');
        price.className = 'price';
        price.textContent = product.priceLabel;
        item.appendChild(price);
    }

    gallery.appendChild(item);
}

async function loadProducts() {
    const gallery = document.getElementById('gallery');
    if (!gallery) {
        console.error('Gallery element not found');
        return;
    }

    try {
        const products = await fetchProductsData();
        gallery.innerHTML = '';
        products.map(normalizeProduct).forEach((product) => {
            renderProduct(gallery, product);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        gallery.innerHTML = '<p>Não foi possível carregar a lista de presentes.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadProducts);
