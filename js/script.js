$(function () {
    $('.slideshow').each(function () {
        initSlideshow($(this));
    });
    initReviews();
    initContactForm();
    initMortgageCalculator();
});

// Each slideshow on a page runs on its own, so its buttons and timer
// only ever move its own slides.
function initSlideshow($slideshow) {
    const $slides = $slideshow.find('.slide');
    if ($slides.length === 0) {
        return;
    }

    let index = 0;
    let timer;

    function show(newIndex) {
        // Wrap around in both directions.
        index = (newIndex + $slides.length) % $slides.length;
        $slides.removeClass('active').eq(index).addClass('active');
    }

    function restartTimer() {
        clearInterval(timer);
        timer = setInterval(function () { show(index + 1); }, 5000);
    }

    $slideshow.find('.next').on('click', function () { show(index + 1); restartTimer(); });
    $slideshow.find('.prev').on('click', function () { show(index - 1); restartTimer(); });

    show(0);
    restartTimer();
}

function initReviews() {
    const $form = $('#review-form');
    if ($form.length === 0) {
        return;
    }

    let reviews;
    try {
        reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    } catch (e) {
        reviews = [];
    }

    function save() {
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }

    function render() {
        const $list = $('#reviews-list').empty();
        if (reviews.length === 0) {
            $list.append($('<p>').text('No reviews yet. Be the first!'));
            return;
        }
        reviews.forEach(function (review, i) {
            // .text() treats the input as plain text, so HTML typed into a review is never run.
            const $item = $('<article class="review-item">');
            $item.append($('<h3>').text(review.name));
            $item.append($('<p class="stars">')
                .attr('aria-label', review.rating + ' out of 5 stars')
                .text('★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)));
            $item.append($('<p>').text(review.comment));
            $item.append($('<button type="button" class="delete-review">').text('Delete').data('index', i));
            $list.append($item);
        });
    }

    $form.on('submit', function (event) {
        event.preventDefault();
        const name = $('#review-name').val().trim();
        const rating = parseInt($('#rating').val(), 10);
        const comment = $('#comment').val().trim();
        if (!name || !rating || !comment) {
            return;
        }
        reviews.push({ name: name, rating: rating, comment: comment });
        save();
        render();
        this.reset();
    });

    $('#reviews-list').on('click', '.delete-review', function () {
        reviews.splice($(this).data('index'), 1);
        save();
        render();
    });

    render();
}

function initContactForm() {
    const $form = $('#contact-form');
    if ($form.length === 0) {
        return;
    }

    function validate() {
        const errors = [];
        const email = $('#email').val().trim();
        // Allow spaces, dashes and brackets, as people often type them in UK numbers.
        const phone = $('#phone').val().replace(/[\s()-]/g, '');

        if ($('#name').val().trim() === '') {
            errors.push('Please enter your name.');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Please enter a valid email address.');
        }
        if (!/^\+?\d{10,13}$/.test(phone)) {
            errors.push('Please enter a valid phone number.');
        }
        if ($('#message').val().trim() === '') {
            errors.push('Please enter a message.');
        }
        if ($('input[name="contact-preference"]:checked').length === 0) {
            errors.push('Please choose how you would like us to contact you.');
        }
        if ($('#property-interest').val() === '') {
            errors.push('Please choose what you are interested in.');
        }
        return errors;
    }

    $form.on('submit', function (event) {
        event.preventDefault();
        const errors = validate();
        const $errors = $('#form-errors').empty();
        $('#form-success').text('');

        if (errors.length > 0) {
            errors.forEach(function (message) {
                $errors.append($('<li>').text(message));
            });
            return;
        }

        // There is no back end, so the form just confirms and clears.
        $('#form-success').text('Thanks for getting in touch. We will reply within one working day.');
        this.reset();
    });
}

function initMortgageCalculator() {
    const $form = $('#mortgage-form');
    if ($form.length === 0) {
        return;
    }

    $form.on('submit', function (event) {
        event.preventDefault();
        const amount = parseFloat($('#loan-amount').val());
        const annualRate = parseFloat($('#interest-rate').val());
        const years = parseInt($('#loan-term').val(), 10);
        const $result = $('#mortgage-result');

        if (!(amount > 0) || !(annualRate >= 0) || !(years > 0)) {
            $result.text('Please enter a loan amount, an interest rate and a term in years.');
            return;
        }

        const months = years * 12;
        const monthlyRate = annualRate / 100 / 12;
        // The standard formula divides by zero at 0% interest, so that case is just an even split.
        const payment = monthlyRate === 0
            ? amount / months
            : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

        $result.text('Monthly payment: £' + payment.toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }));
    });
}
