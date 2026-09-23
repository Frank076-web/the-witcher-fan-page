(function () {
	'use strict';

	function initGaleria(containerId, imagenes = []) {
		const container = document.getElementById(containerId);

		if (!container || !Array.isArray(imagenes)) return;

		const modulo = document.createElement('div');
		modulo.className = 'galeria-modulo';

		const state = {
			imagenes: [...imagenes],
			filtro: 'todos',
			actual: 0,
			modalAbierto: false,
		};

		const categorias = obtenerCategorias(state.imagenes);

		modulo.innerHTML = `
			<div
				class="galeria-modulo__grid"
				aria-live="polite"
			></div>

			<div
				class="galeria-modulo__vacio"
				hidden
			>
				<p>No hay imágenes disponibles para esta categoría.</p>
			</div>

			<div
				class="galeria-modulo__lightbox"
				role="dialog"
				aria-modal="true"
				aria-labelledby="galeria-lightbox-title"
				aria-describedby="galeria-lightbox-description"
				aria-hidden="true"
			>
				<div class="galeria-modulo__backdrop"></div>

				<div class="galeria-modulo__lightbox-content">
					<button
						type="button"
						class="galeria-modulo__lightbox-close"
						aria-label="Cerrar imagen"
					>
						<span aria-hidden="true">&times;</span>
					</button>

					<button
						type="button"
						class="galeria-modulo__lightbox-prev"
						aria-label="Imagen anterior"
					>
						<span aria-hidden="true">&#10094;</span>
					</button>

					<div class="galeria-modulo__lightbox-media">
						<div class="galeria-modulo__lightbox-loader" aria-hidden="true">
							<span></span>
						</div>

						<img
							class="galeria-modulo__lightbox-image"
							src=""
							alt=""
						/>
					</div>

					<button
						type="button"
						class="galeria-modulo__lightbox-next"
						aria-label="Imagen siguiente"
					>
						<span aria-hidden="true">&#10095;</span>
					</button>

					<div class="galeria-modulo__lightbox-info">
						<div class="galeria-modulo__lightbox-meta">
							<span class="galeria-modulo__lightbox-counter"></span>
							<span class="galeria-modulo__lightbox-category"></span>
						</div>

						<h2
							id="galeria-lightbox-title"
							class="galeria-modulo__lightbox-title"
						></h2>

						<p
							id="galeria-lightbox-description"
							class="galeria-modulo__lightbox-description"
						></p>
					</div>
				</div>
			</div>
		`;

		container.replaceChildren(modulo);

		const grid = modulo.querySelector('.galeria-modulo__grid');
		const emptyState = modulo.querySelector('.galeria-modulo__vacio');
		const filterButtons = [
			...modulo.querySelectorAll('.galeria-modulo__filtro'),
		];

		const lightbox = modulo.querySelector('.galeria-modulo__lightbox');
		const lightboxImage = modulo.querySelector(
			'.galeria-modulo__lightbox-image',
		);
		const lightboxTitle = modulo.querySelector(
			'.galeria-modulo__lightbox-title',
		);
		const lightboxDescription = modulo.querySelector(
			'.galeria-modulo__lightbox-description',
		);
		const lightboxCounter = modulo.querySelector(
			'.galeria-modulo__lightbox-counter',
		);
		const lightboxCategory = modulo.querySelector(
			'.galeria-modulo__lightbox-category',
		);
		const lightboxLoader = modulo.querySelector(
			'.galeria-modulo__lightbox-loader',
		);

		const closeButton = modulo.querySelector(
			'.galeria-modulo__lightbox-close',
		);
		const previousButton = modulo.querySelector(
			'.galeria-modulo__lightbox-prev',
		);
		const nextButton = modulo.querySelector(
			'.galeria-modulo__lightbox-next',
		);
		const backdrop = modulo.querySelector('.galeria-modulo__backdrop');

		let previousFocus = null;

		function obtenerCategorias(items) {
			return [
				...new Set(
					items
						.map((item) => item.category)
						.filter(Boolean)
						.map((categoria) => String(categoria).trim()),
				),
			];
		}

		function obtenerImagenesFiltradas() {
			if (state.filtro === 'todos') {
				return state.imagenes;
			}

			return state.imagenes.filter(
				(imagen) =>
					String(imagen.category || '').toLowerCase() ===
					state.filtro.toLowerCase(),
			);
		}

		function renderGaleria() {
			const imagenesFiltradas = obtenerImagenesFiltradas();

			grid.innerHTML = '';

			emptyState.hidden = imagenesFiltradas.length > 0;

			imagenesFiltradas.forEach((imagen, index) => {
				const originalIndex = state.imagenes.indexOf(imagen);

				const card = document.createElement('article');

				card.className = 'galeria-modulo__card';
				card.tabIndex = 0;
				card.setAttribute(
					'aria-label',
					`Abrir imagen: ${imagen.title || imagen.alt || 'Imagen'}`,
				);

				card.innerHTML = `
					<div class="galeria-modulo__media">
						<div class="galeria-modulo__placeholder" aria-hidden="true">
							<span>Sin imagen</span>
						</div>

						<img
							class="galeria-modulo__image"
							src="${escapeAttribute(imagen.src || '')}"
							alt="${escapeAttribute(imagen.alt || imagen.title || '')}"
							loading="lazy"
							decoding="async"
						/>

						<div class="galeria-modulo__overlay" aria-hidden="true">
							<span class="galeria-modulo__zoom-icon">+</span>
						</div>
					</div>

					<div class="galeria-modulo__caption">
						${
							imagen.category
								? `<span class="galeria-modulo__tag">${escapeHTML(
										imagen.category,
									)}</span>`
								: ''
						}

						<h3 class="galeria-modulo__title">
							${escapeHTML(imagen.title || 'Imagen')}
						</h3>
					</div>
				`;

				const image = card.querySelector('.galeria-modulo__image');

				image.addEventListener('load', () => {
					card.classList.add('galeria-modulo__card--loaded');
				});

				image.addEventListener('error', () => {
					card.classList.add('galeria-modulo__card--error');
					image.removeAttribute('src');
					image.alt = '';
				});

				card.addEventListener('click', () => {
					abrirLightbox(originalIndex);
				});

				card.addEventListener('keydown', (event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						abrirLightbox(originalIndex);
					}
				});

				grid.appendChild(card);
			});

			if ('IntersectionObserver' in window && grid.children.length) {
				inicializarObserver();
			}
		}

		let observer = null;

		function inicializarObserver() {
			if (observer) observer.disconnect();

			observer = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (!entry.isIntersecting) return;

						const image = entry.target;

						image.classList.add('galeria-modulo__image--visible');

						observer.unobserve(image);
					});
				},
				{
					rootMargin: '100px 0px',
					threshold: 0.01,
				},
			);

			modulo
				.querySelectorAll('.galeria-modulo__image')
				.forEach((image) => observer.observe(image));
		}

		function actualizarFiltros() {
			filterButtons.forEach((button) => {
				const activo =
					button.dataset.categoria.toLowerCase() ===
					state.filtro.toLowerCase();

				button.classList.toggle(
					'galeria-modulo__filtro--activo',
					activo,
				);

				button.setAttribute('aria-pressed', String(activo));
			});
		}

		function abrirLightbox(index) {
			if (!state.imagenes[index]) return;

			state.actual = index;
			state.modalAbierto = true;
			previousFocus = document.activeElement;

			renderLightbox();

			lightbox.classList.add('galeria-modulo__lightbox--open');

			lightbox.setAttribute('aria-hidden', 'false');

			closeButton.focus();
		}

		function cerrarLightbox() {
			state.modalAbierto = false;

			lightbox.classList.remove('galeria-modulo__lightbox--open');

			lightbox.setAttribute('aria-hidden', 'true');

			lightboxImage.removeAttribute('src');

			if (previousFocus && typeof previousFocus.focus === 'function') {
				previousFocus.focus();
			}
		}

		function renderLightbox() {
			const imagen = state.imagenes[state.actual];

			if (!imagen) return;

			lightboxLoader.classList.add(
				'galeria-modulo__lightbox-loader--visible',
			);

			lightboxImage.classList.remove(
				'galeria-modulo__lightbox-image--visible',
			);

			lightboxImage.alt =
				imagen.alt || imagen.title || 'Imagen de galería';

			lightboxTitle.textContent = imagen.title || 'Imagen';

			lightboxDescription.textContent = imagen.description || '';

			lightboxCounter.textContent = `${state.actual + 1} / ${state.imagenes.length}`;

			lightboxCategory.textContent = imagen.category || '';

			lightboxCategory.hidden = !imagen.category;

			lightboxImage.onload = () => {
				lightboxLoader.classList.remove(
					'galeria-modulo__lightbox-loader--visible',
				);

				lightboxImage.classList.add(
					'galeria-modulo__lightbox-image--visible',
				);
			};

			lightboxImage.onerror = () => {
				lightboxLoader.classList.remove(
					'galeria-modulo__lightbox-loader--visible',
				);

				lightboxImage.removeAttribute('src');
				lightboxImage.alt = 'Imagen no disponible';
			};

			if (imagen.src) {
				lightboxImage.src = imagen.src;
			} else {
				lightboxImage.removeAttribute('src');

				lightboxLoader.classList.remove(
					'galeria-modulo__lightbox-loader--visible',
				);
			}
		}

		function siguiente() {
			state.actual = (state.actual + 1) % state.imagenes.length;

			renderLightbox();
		}

		function anterior() {
			state.actual =
				(state.actual - 1 + state.imagenes.length) %
				state.imagenes.length;

			renderLightbox();
		}

		filterButtons.forEach((button) => {
			button.addEventListener('click', () => {
				state.filtro = button.dataset.categoria || 'todos';

				actualizarFiltros();
				renderGaleria();
			});
		});

		closeButton.addEventListener('click', cerrarLightbox);
		previousButton.addEventListener('click', anterior);
		nextButton.addEventListener('click', siguiente);
		backdrop.addEventListener('click', cerrarLightbox);

		document.addEventListener('keydown', (event) => {
			if (!state.modalAbierto) return;

			if (event.key === 'Escape') {
				event.preventDefault();
				cerrarLightbox();
				return;
			}

			if (event.key === 'ArrowRight') {
				event.preventDefault();
				siguiente();
				return;
			}

			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				anterior();
			}
		});

		renderGaleria();
	}

	function escapeHTML(value) {
		return String(value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function escapeAttribute(value) {
		return escapeHTML(value);
	}

	window.initGaleria = initGaleria;
})();

const imagenesGaleria = [
	{
		src: 'assets/images/geralt_en_kaer_morhen.webp',
		alt: 'Geralt en Kaer Morhen',
		title: 'Geralt en Kaer Morhen',
		category: 'Videojuego',
		description:
			'Geralt de Rivia en Kaer Morhen, la antigua fortaleza de la Escuela del Lobo.',
	},

	{
		src: 'assets/images/casador_de_mounstruos.webp',
		alt: 'Geralt enfrentando a un grifo',
		title: 'Cazador de monstruos',
		category: 'Videojuego',
		description:
			'Geralt enfrentando a un grifo durante una de sus cacerías por el Continente.',
	},

	{
		src: 'assets/images/yennefer_de_vengerberg.webp',
		alt: 'Yennefer en una fortaleza',
		title: 'Yennefer de Vengerberg',
		category: 'Serie',
		description:
			'Yennefer de Vengerberg en uno de los escenarios de la serie de Netflix.',
	},

	{
		src: 'assets/images/la_princesa_de_cintra.webp',
		alt: 'Ciri en el bosque',
		title: 'La Princesa de Cintra',
		category: 'Serie',
		description:
			'Ciri atravesando los bosques del Continente mientras intenta sobrevivir y encontrar su destino.',
	},

	{
		src: 'assets/images/la_batalla_de_sodden.webp',
		alt: 'Batalla de Sodden',
		title: 'La batalla de Sodden',
		category: 'Serie',
		description:
			'Los magos del Continente enfrentándose al ejército de Nilfgaard durante la batalla de Sodden.',
	},

	{
		src: 'assets/images/novigrado.webp',
		alt: 'Ciudad de Novigrado',
		title: 'Novigrado',
		category: 'Videojuego',
		description:
			'La enorme ciudad libre de Novigrado, uno de los principales escenarios de The Witcher 3: Wild Hunt.',
	},

	{
		src: 'assets/images/islas_skellige.webp',
		alt: 'Paisaje de Skellige',
		title: 'Las islas de Skellige',
		category: 'Videojuego',
		description:
			'El agreste paisaje de Skellige, un archipiélago marcado por sus clanes, montañas y mares.',
	},

	{
		src: 'assets/images/la_fortaleza_del_lobo.webp',
		alt: 'Kaer Morhen',
		title: 'La fortaleza del Lobo',
		category: 'Mixto',
		description:
			'Kaer Morhen, hogar tradicional de los brujos de la Escuela del Lobo y lugar fundamental en la historia de Geralt y Ciri.',
	},

	{
		src: 'assets/images/jaskier_el_bardo.webp',
		alt: 'Jaskier con su laúd',
		title: 'Jaskier, el bardo',
		category: 'Serie',
		description:
			'Jaskier, el carismático bardo que acompaña a Geralt y convierte sus aventuras en canciones.',
	},

	{
		src: 'assets/images/triss_merigold.webp',
		alt: 'Triss Merigold en Novigrado',
		title: 'Triss Merigold',
		category: 'Videojuego',
		description:
			'Triss Merigold durante los acontecimientos de The Witcher 3: Wild Hunt en Novigrado.',
	},

	{
		src: 'assets/images/vesemir.webp',
		alt: 'Vesemir',
		title: 'Vesemir',
		category: 'Mixto',
		description:
			'Vesemir, el brujo más veterano de Kaer Morhen y una figura fundamental para Geralt y los demás brujos.',
	},

	{
		src: 'assets/images/la_caceria_salvaje.webp',
		alt: 'La Cacería Salvaje',
		title: 'La Cacería Salvaje',
		category: 'Videojuego',
		description:
			'La Cacería Salvaje, el grupo de espectros que persigue a Ciri a través de diferentes mundos.',
	},
];

document.addEventListener('DOMContentLoaded', () => {
	initGaleria('galeria-modulo', imagenesGaleria);
});
