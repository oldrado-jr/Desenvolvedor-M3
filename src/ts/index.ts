import { Product } from './Product';

async function getProducts(): Promise<Product[]> {
  const serverUrl = 'http://localhost:5000';
  const response = await fetch(`${serverUrl}/products`);
  return await response.json();
}

async function renderProducts(page = 1, perPage = 9) {
  const products = await getProducts();
  const productsToRender = products.splice((page - 1) * perPage, perPage);

  productsToRender.map((product, index) => {
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

  const allProductsRendered = productsToRender.length === 0 || productsToRender.length < perPage;

  if (allProductsRendered) {
    document.querySelector('#load-products').remove();
  }
}

async function handleLoadProducts(page = 1, perPage = 9) {
  await renderProducts(++page, perPage);
}

function handleFilterButtons(container?: Element) {
  if (!container) {
    return;
  }

  container.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
}

function handleCloseIcon(e: Event) {
  (e.currentTarget as Node).parentElement.parentElement.setAttribute('hidden', 'hidden');
  document.body.style.overflow = 'initial';
}

function handleToggleFilter(element: Element) {
  const parentElement = element.parentElement;
  parentElement.classList.toggle('open');
  parentElement.querySelectorAll('label').forEach((label) => {
    label.toggleAttribute('hidden');
  });

  const sizes = parentElement.querySelector('ul');

  if (sizes) {
    if (parentElement.classList.contains('open')) {
      sizes.style.display = 'flex';
    } else {
      sizes.style.display = 'none';
    }
  }

  const buttons = document.querySelectorAll('#filter-button-container button');

  if (document.querySelectorAll('#filter-mobile .open').length > 0) {
    buttons.forEach((button) => {
      button.removeAttribute('hidden');
    });
  } else {
    buttons.forEach((button) => {
      button.setAttribute('hidden', 'hidden');
    });
  };
}

function hideFiltersOnInit() {
  document.querySelectorAll('#filter-mobile label, #filter-button-container button').forEach((element) => {
    element.setAttribute('hidden', 'hidden');
  });

  (document.querySelector('#filter-mobile ul') as HTMLElement).style.display = 'none';
}

function initializeMobileFilterButtons() {
  document.querySelector('#ordering-button').addEventListener('click', () => {
    handleFilterButtons(document.querySelector('#ordering-container'));
  });

  document.querySelector('#filtering-button').addEventListener('click', () => {
    handleFilterButtons(document.querySelector('#filtering-container'));
  });
}

function initializeMobileFilters() {
  initializeMobileFilterButtons();

  document.querySelectorAll('.close-icon').forEach((element) => {
    element.addEventListener('click', handleCloseIcon);
  });

  hideFiltersOnInit();

  document.querySelectorAll('#filter-mobile .filter-text').forEach((element) => {
    element.addEventListener('click', () => {
      handleToggleFilter(element);
    });
  });
}

async function main() {
  let page = 1;
  let perPage = 9;
  const baseWidth = 700;

  if (document.body.offsetWidth <= baseWidth) {
    perPage = Math.trunc(Math.floor(perPage / 2));
  }

  await renderProducts(page, perPage);

  document.querySelector('#load-products').addEventListener('click', async () => {
    await handleLoadProducts(page, perPage);
  });

  initializeMobileFilters();
}

document.addEventListener("DOMContentLoaded", main);
