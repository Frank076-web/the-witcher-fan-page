document.addEventListener('DOMContentLoaded', () => {
	// ---------------------------
	// Navegación móvil
	// ---------------------------
	const menuToggle = document.querySelector('.menu-toggle');
	const nav = document.querySelector('.nav');
	if (menuToggle && nav) {
		menuToggle.addEventListener('click', () => {
			const open = nav.classList.toggle('open');
			menuToggle.setAttribute('aria-expanded', String(open));
			menuToggle.innerHTML = open
				? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
				: '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
		});
	}

	// ---------------------------
	// Tema persistente
	// ---------------------------
	const themeToggle = document.querySelector('.theme-toggle');
	const savedTheme = localStorage.getItem('witcher-theme');
	if (savedTheme === 'light') document.documentElement.classList.add('light');
	updateThemeIcon();

	themeToggle?.addEventListener('click', () => {
		document.documentElement.classList.toggle('light');
		localStorage.setItem(
			'witcher-theme',
			document.documentElement.classList.contains('light')
				? 'light'
				: 'dark',
		);
		updateThemeIcon();
	});

	function updateThemeIcon() {
		if (!themeToggle) return;
		const light = document.documentElement.classList.contains('light');
		themeToggle.innerHTML = light
			? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
			: '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
		themeToggle.setAttribute(
			'aria-label',
			light ? 'Activar modo oscuro' : 'Activar modo claro',
		);
		themeToggle.title = light ? 'Modo oscuro' : 'Modo claro';
	}

	// ---------------------------
	// Año dinámico
	// ---------------------------
	document.querySelectorAll('[data-year]').forEach((el) => {
		el.textContent = new Date().getFullYear();
	});

	// ---------------------------
	// Scroll suave para anchors
	// ---------------------------
	document.querySelectorAll('a[href^="#"]').forEach((link) => {
		link.addEventListener('click', (e) => {
			const id = link.getAttribute('href');
			if (id && id !== '#') {
				const target = document.querySelector(id);
				if (target) {
					e.preventDefault();
					target.scrollIntoView({
						behavior: 'smooth',
						block: 'start',
					});
				}
			}
		});
	});

	// ---------------------------
	// Filtro de personajes
	// ---------------------------
	const filterButtons = document.querySelectorAll('[data-filter]');
	const characterCards = document.querySelectorAll(
		'.card-personaje[data-categoria]',
	);

	filterButtons.forEach((button) => {
		button.addEventListener('click', () => {
			filterButtons.forEach((btn) => {
				btn.classList.remove('active');
			});

			button.classList.add('active');

			const filter = button.dataset.filter;

			characterCards.forEach((card) => {
				const categories = card.dataset.categoria
					.toLowerCase()
					.split(/\s+/)
					.filter(Boolean);

				const shouldShow =
					filter === 'todos' ||
					categories.includes(filter.toLowerCase());

				card.classList.toggle('hidden', !shouldShow);
			});
		});
	});

	// ---------------------------
	// Acordeón de noticias
	// ---------------------------
	document.querySelectorAll('.news-toggle').forEach((button) => {
		button.addEventListener('click', () => {
			const item = button.closest('.news-item');
			const expanded = item.classList.toggle('expanded');
			button.textContent = expanded ? 'Leer menos' : 'Leer más';
			button.setAttribute('aria-expanded', String(expanded));
		});
	});

	// ---------------------------
	// Quiz
	// ---------------------------
	const quiz = document.querySelector('#witcher-quiz');
	if (quiz) {
		const questions = [
			{
				q: '¿Qué espada se asocia principalmente con los monstruos?',
				a: ['Acero', 'Plata', 'Obsidiana', 'Madera'],
				correct: 1,
			},
			{
				q: '¿Quién entrenó a Ciri en Kaer Morhen?',
				a: [
					'Geralt y otros brujos',
					'Vilgefortz',
					'Emhyr',
					'Stregobor',
				],
				correct: 0,
			},
			{
				q: '¿Qué juego presenta Velen, Novigrado y Skellige?',
				a: [
					'The Witcher',
					'The Witcher 2',
					'The Witcher 3',
					'Thronebreaker',
				],
				correct: 2,
			},
			{
				q: '¿Cómo se llama la hechicera vinculada sentimentalmente con Geralt?',
				a: ['Triss', 'Yennefer', 'Fringilla', 'Sabrina'],
				correct: 1,
			},
			{
				q: '¿Quién interpreta a Geralt en las temporadas 1-3 de Netflix?',
				a: [
					'Liam Hemsworth',
					'Henry Cavill',
					'Eamon Farren',
					'Joey Batey',
				],
				correct: 1,
			},
			{
				q: '¿Qué personaje es conocido como Jaskier en la serie?',
				a: ['El bardo', 'El rey', 'El brujo', 'El alquimista'],
				correct: 0,
			},
		];
		let current = 0,
			score = 0;
		const questionEl = quiz.querySelector('.quiz-question-text');
		const optionsEl = quiz.querySelector('.quiz-options');
		const progressEl = quiz.querySelector('.quiz-progress');
		const resultEl = quiz.querySelector('.quiz-result');
		const nextBtn = quiz.querySelector('.quiz-next');

		const renderQuestion = () => {
			const item = questions[current];
			questionEl.textContent = item.q;
			progressEl.textContent = `Pregunta ${current + 1} de ${questions.length}`;
			optionsEl.innerHTML = '';
			resultEl.classList.add('hidden');
			nextBtn.disabled = true;
			item.a.forEach((answer, index) => {
				const button = document.createElement('button');
				button.className = 'quiz-option';
				button.type = 'button';
				button.textContent = answer;
				button.addEventListener('click', () => {
					optionsEl
						.querySelectorAll('button')
						.forEach((b) => (b.disabled = true));
					button.classList.add('selected');
					if (index === item.correct) score++;
					nextBtn.disabled = false;
				});
				optionsEl.appendChild(button);
			});
			nextBtn.textContent =
				current === questions.length - 1
					? 'Ver resultado'
					: 'Siguiente';
		};

		nextBtn.addEventListener('click', () => {
			if (current < questions.length - 1) {
				current++;
				renderQuestion();
			} else {
				questionEl.textContent = 'Quiz terminado';
				optionsEl.innerHTML = '';
				progressEl.textContent = '';
				resultEl.textContent = `Tu puntuación: ${score}/${questions.length}.`;
				resultEl.classList.remove('hidden');
				nextBtn.textContent = 'Reiniciar';
				nextBtn.disabled = false;
				current = -1;
				score = 0;
			}
			if (current === -1) {
				nextBtn.onclick = () => {
					current = 0;
					renderQuestion();
				};
			}
		});
		renderQuestion();
	}

	// ---------------------------
	// Formulario de contacto
	// ---------------------------
	const form = document.querySelector('#contact-form');
	if (form) {
		const message = form.querySelector('.form-message');
		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const email = form.querySelector('#email');
			if (!form.checkValidity() || !email.validity.valid) {
				form.reportValidity();
				return;
			}
			message.textContent =
				'Mensaje enviado correctamente. Esta demo no conecta con un servidor real.';
			message.classList.add('show');
			form.reset();
		});
	}

	const mapElement = document.getElementById('contact-map');

	if (!mapElement || typeof L === 'undefined') return;

	const officeCoordinates = [40.4168, -3.7038];

	const map = L.map(mapElement, {
		scrollWheelZoom: true,
		zoomControl: true,
	}).setView(officeCoordinates, 13);

	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; OpenStreetMap contributors',
	}).addTo(map);

	L.marker(officeCoordinates)
		.addTo(map)
		.bindPopup('<strong>Oficina</strong><br>La Posada del Lobo')
		.openPopup();
});
