import { useEffect, useState } from "react";
import venueExteriorDay from "./assets/venue-exterior-day.jpg";
import venueExteriorNight from "./assets/venue-exterior-night.png";
import venueAltOne from "./assets/venue-alt-1.jpg";

const targetDate = new Date("2026-08-14T00:00:00+03:00");

const scheduleItems = [
  {
    time: "11.40",
    title: "Регистрация брака",
    description: "Самый трогательный момент, с которого начнётся наша семейная история.",
  },
  {
    time: "13.00",
    title: "Фотосессия",
    description: "Поймаем первые кадры этого дня и сохраним его в самых тёплых деталях.",
  },
  {
    time: "16.00",
    title: "Сбор гостей и фуршет",
    description: "Встретимся, обнимемся, скажем первые тёплые слова и настроимся на праздник.",
    accent: true,
  },
  {
    time: "17.00",
    title: "Банкет",
    description: "Поднимем бокалы, будем смеяться, танцевать и проживать этот вечер вместе.",
  },
  {
    time: "23.00",
    title: "Окончание вечера",
    description: "Проводим этот день с улыбкой и ощущением настоящего счастья внутри.",
  },
];

const swatches = [
  { label: "Шалфей", color: "#8f9f83" },
  { label: "Нежная\nолива", color: "#b5c2a8" },
  { label: "Молочный\nтуман", color: "#edf3e8" },
  { label: "Пыльная\nроза", color: "#d5b9b5" },
  { label: "Светлый\nжемчуг", color: "#f7f5ef" },
];

const attendanceOptions = [
  { value: "yes", label: "С радостью буду" },
  { value: "pair", label: "Буду с парой" },
  { value: "no", label: "К сожалению, не смогу" },
];

const responseNote =
  "Пожалуйста, оставьте ответ в форме ниже. Нам будет спокойнее и радостнее готовить этот день, зная, что вы рядом.";

function HeartIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 52C16 42 8 32.5 8 22.5C8 15.5 13 10 19.5 10C25 10 29 13 32 18C35 13 39 10 44.5 10C51 10 56 15.5 56 22.5C56 32.5 48 42 32 52Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M24 4L28 20L44 24L28 28L24 44L20 28L4 24L20 20L24 4Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatCountdown() {
  const difference = targetDate.getTime() - Date.now();

  if (difference <= 0) {
    return { days: "00", hours: "00", minutes: "00" };
  }

  const totalMinutes = Math.floor(difference / (1000 * 60));
  const days = String(Math.floor(totalMinutes / (60 * 24))).padStart(2, "0");
  const hours = String(Math.floor((totalMinutes % (60 * 24)) / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");

  return { days, hours, minutes };
}

export default function App() {
  const [countdown, setCountdown] = useState(() => formatCountdown());
  const [heroReveal, setHeroReveal] = useState({
    names: false,
    details: false,
  });
  const [formState, setFormState] = useState({
    name: "",
    attendance: "yes",
    companion: "",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitState, setSubmitState] = useState("idle");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(formatCountdown());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setHeroReveal({
        names: true,
        details: true,
      });
      return undefined;
    }

    const timers = [
      window.setTimeout(() => setHeroReveal((prev) => ({ ...prev, names: true })), 1650),
      window.setTimeout(() => setHeroReveal((prev) => ({ ...prev, details: true })), 2500),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    const items = document.querySelectorAll("[data-reveal]");
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();

      if (rect.top < window.innerHeight * 0.92) {
        item.classList.add("is-visible");
        return;
      }

      observer.observe(item);
    });

    return () => observer.disconnect();
  }, []);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState("submitting");
    setSubmitError("");

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Не удалось отправить ответ.");
      }

      setSubmitted(true);
      setSubmitState("success");
    } catch (error) {
      setSubmitState("error");
      setSubmitError(
        error instanceof Error ? error.message : "Не удалось отправить ответ. Попробуйте ещё раз."
      );
    }
  }

  const attendanceText =
    attendanceOptions.find((option) => option.value === formState.attendance)?.label ??
    attendanceOptions[0].label;

  return (
    <div className="page">
      <div className="page-glow page-glow--one" aria-hidden="true" />
      <div className="page-glow page-glow--two" aria-hidden="true" />

      <header className="hero" id="top">
        <div className="hero__mist hero__mist--one" aria-hidden="true" />
        <div className="hero__mist hero__mist--two" aria-hidden="true" />

        <div className="hero__poster">
          <div className="hero__dateMark">
            <span>14 августа 2026</span>
            <span>пятница</span>
          </div>

          <div className="hero__ringsScene" aria-hidden="true">
            <div className="hero__halo hero__halo--left" />
            <div className="hero__halo hero__halo--right" />
            <div className="hero__ring hero__ring--left">
              <span className="hero__ringStone" />
            </div>
            <div className="hero__ring hero__ring--right">
              <span className="hero__ringStone" />
            </div>
            <div className="hero__burst">
              <span className="hero__burstCore" />
              <span className="hero__burstSpark hero__burstSpark--one" />
              <span className="hero__burstSpark hero__burstSpark--two" />
              <span className="hero__burstSpark hero__burstSpark--three" />
              <span className="hero__burstSpark hero__burstSpark--four" />
            </div>
          </div>

          <div
            className={`hero__writing hero__writing--names${heroReveal.names ? " is-visible" : ""}`}
            aria-label="Алина и Андрей женятся"
          >
            <p className="hero__name hero__name--first">Алина</p>
            <p className="hero__amp">и</p>
            <p className="hero__name hero__name--second">Андрей</p>
            <p className="hero__subline">женятся</p>
          </div>

          <div className={`hero__after${heroReveal.details ? " is-visible" : ""}`}>
            <p className="hero__lead">
              С большой радостью приглашаем вас разделить с нами день, в который мы скажем
              друг другу «да».
            </p>

            <div className="hero__facts">
              <div className="hero__fact">
                <strong>16:00</strong>
                <span>ждём гостей</span>
              </div>
              <div className="hero__fact">
                <strong>17:00</strong>
                <span>начинаем банкет</span>
              </div>
              <div className="hero__fact">
                <strong>Кролик в шляпе</strong>
                <span>локация</span>
              </div>
            </div>

            <div className="hero__actions">
              <a className="button" href="#schedule">
                План дня
              </a>
              <a className="button button--ghost" href="#rsvp">
                Ответить
              </a>
            </div>

            <div className="countdown">
              <p className="countdown__title">До встречи осталось</p>
              <div className="countdown__grid">
                <div className="countdown__item">
                  <span className="countdown__value">{countdown.days}</span>
                  <span className="countdown__label">дней</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value">{countdown.hours}</span>
                  <span className="countdown__label">часов</span>
                </div>
                <div className="countdown__item">
                  <span className="countdown__value">{countdown.minutes}</span>
                  <span className="countdown__label">минут</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="section section--day" id="schedule">
          <div className="wrap">
            <div className="section__intro reveal" data-reveal>
              <h2 className="section__title">Как пройдёт наш день</h2>
              <p className="section__copy">
                Нам будет особенно радостно прожить вместе с вами каждый его тёплый
                момент.
              </p>
            </div>

            <div className="timeline">
              {scheduleItems.map((item) => (
                <article
                  className={`timeline__item reveal${item.accent ? " timeline__item--accent" : ""}`}
                  data-reveal
                  key={item.time}
                >
                  <time className="timeline__time">{item.time}</time>
                  <div className="timeline__content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--venue" id="venue">
          <div className="wrap venue">
            <div className="venue__media reveal" data-reveal>
              <figure className="venue__photo venue__photo--main">
                <img src={venueExteriorDay} alt="Фасад ресторана «Кролик в шляпе»" />
              </figure>

              <figure className="venue__photo venue__photo--side">
                <img src={venueAltOne} alt="Светлый зал с панорамными окнами" />
              </figure>
            </div>

            <div className="venue__copy reveal" data-reveal>
              <p className="venue__eyebrow">Ресторан «Кролик в шляпе»</p>
              <h2 className="section__title">Место нашей встречи</h2>
              <p className="venue__address">д. Янино-2, Красногорская улица, 19</p>
              <p className="section__copy">
                Просторный панорамный зал, мягкий вечерний свет и та самая атмосфера, в
                которой хочется не торопиться и просто быть рядом.
              </p>

              <div className="venue__actions">
                <a
                  className="button"
                  href="https://yandex.ru/maps/-/CPCdy29j"
                  target="_blank"
                  rel="noreferrer"
                >
                  Построить маршрут
                </a>
                <a className="button button--ghost" href="/wedding-day.ics" download>
                  Сохранить дату
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--palette" id="palette">
          <div className="wrap palette">
            <div className="palette__copy reveal" data-reveal>
              <h2 className="section__title">Палитра вечера</h2>
              <p className="section__copy">
                Если вам захочется поддержать настроение вечера, эти мягкие тона будут
                особенно созвучны нашему дню.
              </p>
            </div>

            <div className="palette__board reveal" data-reveal>
              <ul className="palette__swatches" aria-label="Цветовая палитра вечера">
                {swatches.map((swatch) => (
                  <li className="palette__swatch" key={swatch.label}>
                    <span className="palette__circle" style={{ "--swatch": swatch.color }} />
                    <span className="palette__label">{swatch.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section section--rsvp" id="rsvp">
          <div className="wrap rsvp">
            <div className="rsvp__intro reveal" data-reveal>
              <h2 className="section__title">Будем ждать ваш ответ</h2>
              <p className="section__copy">{responseNote}</p>
            </div>

            <div className="rsvp__panel reveal" data-reveal>
              <div className="rsvp__sparkle rsvp__sparkle--one" aria-hidden="true">
                <SparkleIcon />
              </div>
              <div className="rsvp__sparkle rsvp__sparkle--two" aria-hidden="true">
                <HeartIcon />
              </div>
              <div className="rsvp__panelHead">
                <p className="rsvp__eyebrow">Анкета гостя</p>
                <p className="rsvp__panelCopy">
                  Пара строк в этой форме поможет нам сделать вечер уютным для каждого.
                </p>
              </div>

              {submitted ? (
                <div className="rsvp__thanks">
                  <HeartIcon className="rsvp__thanksIcon" />
                  <h3>Спасибо</h3>
                  <p>
                    Нам очень приятно. {formState.name || "Ваш"} ответ согрел нас ещё до
                    самого праздника.
                  </p>
                  <p className="rsvp__summary">{attendanceText}</p>
                  {formState.attendance === "pair" && formState.companion ? (
                    <p className="rsvp__summary">Вместе с: {formState.companion}</p>
                  ) : null}
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setSubmitState("idle");
                      setSubmitError("");
                    }}
                  >
                    Изменить ответ
                  </button>
                </div>
              ) : (
                <form className="rsvp__form" onSubmit={handleSubmit}>
                  <p className="rsvp__delivery">
                    После отправки ответ сразу уйдёт жениху в Telegram.
                  </p>

                  <label className="rsvp__field">
                    <span>Ваше имя</span>
                    <input
                      name="name"
                      type="text"
                      value={formState.name}
                      onChange={handleInputChange}
                      placeholder="Например, Мария Иванова"
                      required
                    />
                  </label>

                  <fieldset className="rsvp__field rsvp__field--options">
                    <legend>Сможете ли вы быть с нами?</legend>
                    <div className="rsvp__options">
                      {attendanceOptions.map((option) => (
                        <label
                          className={`rsvp__option${
                            formState.attendance === option.value ? " is-selected" : ""
                          }`}
                          key={option.value}
                        >
                          <input
                            type="radio"
                            name="attendance"
                            value={option.value}
                            checked={formState.attendance === option.value}
                            onChange={handleInputChange}
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  {formState.attendance === "pair" ? (
                    <label className="rsvp__field">
                      <span>Имя вашей пары</span>
                      <input
                        name="companion"
                        type="text"
                        value={formState.companion}
                        onChange={handleInputChange}
                        placeholder="Кого ждать вместе с вами"
                      />
                    </label>
                  ) : null}

                  <label className="rsvp__field">
                    <span>Пара слов для нас</span>
                    <textarea
                      name="note"
                      value={formState.note}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Если захотите, можно оставить пожелание или важный нюанс"
                    />
                  </label>

                  {submitError ? <p className="rsvp__status rsvp__status--error">{submitError}</p> : null}

                  <button className="button" type="submit" disabled={submitState === "submitting"}>
                    {submitState === "submitting" ? "Отправляем..." : "Отправить ответ"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="closing" id="closing">
          <div
            className="closing__backdrop"
            aria-hidden="true"
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(54, 66, 47, 0.74), rgba(54, 66, 47, 0.46)), url(${venueExteriorNight})`,
            }}
          />

          <div className="wrap closing__content reveal" data-reveal>
            <p className="closing__venueTag">Ресторан «Кролик в шляпе»</p>
            <h2 className="closing__title">До скорой встречи</h2>
            <p className="closing__copy">
              Спасибо, что разделяете с нами этот день. Пусть он станет одним из самых
              светлых воспоминаний нашего лета.
            </p>
            <p className="closing__meta">14 августа • 16:00 • «Кролик в шляпе»</p>

            <div className="closing__actions">
              <a
                className="button button--light"
                href="https://yandex.ru/maps/-/CPCdy29j"
                target="_blank"
                rel="noreferrer"
              >
                Открыть маршрут
              </a>
              <a className="button button--ghost-light" href="#top">
                К началу
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
