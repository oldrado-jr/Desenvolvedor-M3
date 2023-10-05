import { Product } from "./Product";

async function getProducts(): Promise<Product[]> {
  const serverUrl = 'http://localhost:5000';
  const response = await fetch(`${serverUrl}/products`);
  return await response.json();
}

async function renderProducts(page = 1, perPage = 9) {
  const products = await getProducts();
  const removedProducts = products.splice((page - 1) * perPage, perPage);

  removedProducts.map((product, index) => {
    if (index >= perPage) {
      return;
    }

    const productLine = `<li>
      <img src="${product.image}" alt="${product.name}">
      <span class="product-name">${product.name}</span>
      <div>
        <span class="product-price">R$${product.price.toFixed(2).replace('.', ',')}</span>
        <span class="product-installment">até ${product.parcelamento[0]}x de R$${product.parcelamento[1].toFixed(2).replace('.', ',')}</span>
      </div>
      <button type="button">Comprar</button>
    </li>`;
    document.querySelector('#products-list ul').innerHTML += productLine;
  });

  if (removedProducts.length === 0 || removedProducts.length < perPage) {
    document.querySelector('#load-products').remove();
  }
}

async function main() {
  let page = 1;
  let perPage = 9;

  if (document.body.offsetWidth <= 700) {
    perPage = Math.trunc(Math.floor(perPage / 2));
  }

  await renderProducts(page, perPage);

  document.querySelector('#load-products').addEventListener('click', async () => {
    page++;
    await renderProducts(page, perPage);
  });
}

document.addEventListener("DOMContentLoaded", main);
