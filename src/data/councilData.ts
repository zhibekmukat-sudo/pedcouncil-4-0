export type Language = 'kk' | 'ru';

export type SurveyId = 'survey_1' | 'case_1' | 'case_2' | 'case_3';

export type PageRoute = 'home' | 'surveys' | 'projector' | 'admin';

export interface BilingualText {
  kk: string;
  ru: string;
}

export interface SurveyOption {
  id: string;
  code?: string;
  label: BilingualText;
}

export interface SurveyDefinition {
  id: SurveyId;
  order: number;
  kind: 'multi' | 'single' | 'sequence';
  maxSelections?: number;
  shortTitle: BilingualText;
  title: BilingualText;
  context?: BilingualText;
  question: BilingualText;
  instruction?: BilingualText;
  options: SurveyOption[];
  correctOptionId?: string;
  correctSequence?: string[];
  correctExplanation?: BilingualText;
}

export interface SurveyConfigDoc {
  surveyId: SurveyId;
  isOpen: boolean;
  showLiveResults: boolean;
  showCorrectAnswer: boolean;
  activeRound: number;
  updatedAt?: Date | null;
}

export interface CouncilSettingsDoc {
  videoUrl: string;
  videoType: 'none' | 'youtube' | 'vimeo' | 'direct';
  videoTitle: string;
  preventDuplicateVotes: boolean;
  updatedAt?: Date | null;
}

export interface SurveyResponseDoc {
  id: string;
  surveyId: SurveyId;
  round: number;
  sessionId: string;
  selectedOptions: string[];
  sequence: string[];
  language: Language;
  submittedAt: Date | null;
}

export const SURVEY_IDS: SurveyId[] = ['survey_1', 'case_1', 'case_2', 'case_3'];

export const SURVEYS: Record<SurveyId, SurveyDefinition> = {
  survey_1: {
    id: 'survey_1',
    order: 1,
    kind: 'single',
    shortTitle: {
      kk: 'Цифрлық басымдық',
      ru: 'Цифровой приоритет',
    },
    title: {
      kk: 'Сауалнама № 1 — «Цифрлық басымдық»',
      ru: 'Опрос № 1 — «Цифровой приоритет»',
    },
    question: {
      kk: 'Колледжді цифрландырудың қай бағытын бірінші кезекте дамыту қажет?',
      ru: 'Какое направление цифровизации колледжа необходимо развивать в первую очередь?',
    },
    instruction: {
      kk: 'Бір жауап нұсқасын таңдаңыз.',
      ru: 'Выберите один вариант ответа.',
    },
    options: [
      {
        id: 'ai_training',
        code: '1',
        label: {
          kk: 'Педагогтерді жасанды интеллектпен жұмыс істеуге үйрету',
          ru: 'Обучение педагогов работе с ИИ',
        },
      },
      {
        id: 'digital_bank',
        code: '2',
        label: {
          kk: 'Цифрлық оқу материалдарының бірыңғай қорын құру',
          ru: 'Создание единого банка цифровых учебных материалов',
        },
      },
      {
        id: 'simulators',
        code: '3',
        label: {
          kk: 'Цифрлық тренажерларды дамыту',
          ru: 'Развитие цифровых тренажёров',
        },
      },
      {
        id: 'quality_monitoring',
        code: '4',
        label: {
          kk: 'Оқыту сапасының мониторингін автоматтандыру',
          ru: 'Автоматизация мониторинга качества обучения',
        },
      },
      {
        id: 'it_infra',
        code: '5',
        label: {
          kk: 'IT-инфрақұрылымды жаңарту',
          ru: 'Обновление IT-инфраструктуры',
        },
      },
    ],
  },

  case_1: {
    id: 'case_1',
    order: 2,
    kind: 'single',
    shortTitle: {
      kk: 'Тәлімгер жас оқытушыға қалай көмектесе алады?',
      ru: 'Как наставнику помочь молодому преподавателю?',
    },
    title: {
      kk: 'Педагогикалық кейс № 1 — Тәлімгерлік',
      ru: 'Педагогический кейс № 1 — Наставничество',
    },
    context: {
      kk: 'Жас оқытушы сабаққа дайындалды, алайда студенттер белсенділік танытпайды. Бірнеше студент алаңдап, оқытушы жоспарланған тапсырмаларды орындап үлгермейді және өзінің кәсіби қабілетіне күмәндана бастайды.',
      ru: 'Молодой преподаватель подготовил урок, однако студенты не проявляют активности. Несколько человек отвлекаются, преподаватель не успевает выполнить запланированные задания и начинает сомневаться в своих профессиональных способностях.',
    },
    question: {
      kk: 'Мұндай жағдайда тәлімгер қалай көмектесуі керек?',
      ru: 'Как наставник должен помочь в этой ситуации?',
    },
    instruction: {
      kk: 'Бір жауап нұсқасын таңдаңыз.',
      ru: 'Выберите один вариант ответа.',
    },
    correctOptionId: 'B',
    correctExplanation: {
      kk: 'Тәлімгерлік қолдауы сабақты бірлесіп талдауға, кедергілерді анықтауға және жас педагогпен бірге жақсарту жоспарын әзірлеуге негізделеді.',
      ru: 'Эффективное наставничество строится на совместном разборе урока, выявлении причин трудностей и разработке конструктивного плана улучшений.',
    },
    options: [
      {
        id: 'A',
        code: 'A',
        label: {
          kk: 'Оқытушыға мәселені өз бетінше шешуге кеңес беру.',
          ru: 'Посоветовать преподавателю самостоятельно разобраться в проблеме.',
        },
      },
      {
        id: 'B',
        code: 'B',
        label: {
          kk: 'Сабақты бірлесіп талдап, оны жақсарту жоспарын әзірлеу.',
          ru: 'Совместно проанализировать урок и разработать план улучшения.',
        },
      },
      {
        id: 'C',
        code: 'C',
        label: {
          kk: 'Күрделі сабақтарды өз мойнына алу.',
          ru: 'Взять проведение сложных уроков на себя.',
        },
      },
      {
        id: 'D',
        code: 'D',
        label: {
          kk: 'Тәртіп туралы ескертулермен ғана шектелу.',
          ru: 'Ограничиться замечаниями о дисциплине.',
        },
      },
    ],
  },

  case_2: {
    id: 'case_2',
    order: 3,
    kind: 'single',
    shortTitle: {
      kk: 'Студенттердің білім олқылықтарын қалай жоюға болады?',
      ru: 'Как устранить пробелы в знаниях студентов?',
    },
    title: {
      kk: 'Педагогикалық кейс № 2 — Кіріс бақылау нәтижелері',
      ru: 'Педагогический кейс № 2 — Результаты входного контроля',
    },
    context: {
      kk: 'Пән бойынша кіріс бақылау жұмысының қорытындысы топтағы студенттердің дайындық деңгейі әртүрлі екенін және базалық тақырыптарда олқылықтар бар екенін көрсетті.',
      ru: 'Анализ результатов входного контроля показал разный уровень базовой подготовки студентов группы и наличие пробелов по ключевым темам.',
    },
    question: {
      kk: 'Оқытушы ең алдымен қандай әрекет жасауы керек?',
      ru: 'Какое действие преподавателя должно быть первоочередным?',
    },
    instruction: {
      kk: 'Бір жауап нұсқасын таңдаңыз.',
      ru: 'Выберите один вариант ответа.',
    },
    correctOptionId: 'B',
    correctExplanation: {
      kk: 'Кіріс бақылаудың мақсаты — нақты білім олқылықтарын диагностикалап, әр студенттің деңгейіне сай сараланған жұмыс ұйымдастыру.',
      ru: 'Задача входного контроля — точечно выявить пробелы и выстроить дифференцированную работу с учётом уровня студентов.',
    },
    options: [
      {
        id: 'A',
        code: 'A',
        label: {
          kk: 'Қосымша талдау жасамай, барлық материалды қайта түсіндіру.',
          ru: 'Повторить весь материал без дополнительного анализа.',
        },
      },
      {
        id: 'B',
        code: 'B',
        label: {
          kk: 'Нақты білім олқылықтарын анықтап, сараланған жұмысты ұйымдастыру.',
          ru: 'Выявить конкретные пробелы и организовать дифференцированную работу.',
        },
      },
      {
        id: 'C',
        code: 'C',
        label: {
          kk: 'Бақылау жұмыстарын көбейту.',
          ru: 'Увеличить количество контрольных работ.',
        },
      },
      {
        id: 'D',
        code: 'D',
        label: {
          kk: 'Аралық аттестаттауға дейін нәтижелерді өзгертпей қалдыру.',
          ru: 'Оставить результаты без изменений до промежуточной аттестации.',
        },
      },
    ],
  },

  case_3: {
    id: 'case_3',
    order: 4,
    kind: 'single',
    shortTitle: {
      kk: 'Бірінші курс студентіне колледжге бейімделуге қалай көмектесуге болады?',
      ru: 'Как помочь первокурснику адаптироваться в колледже?',
    },
    title: {
      kk: 'Кейс № 3. «Бейімделуде қиындық көріп жүрген бірінші курс студентін оқытушы мен куратор қалай қолдауы керек?»',
      ru: 'Кейс № 3. «Как педагогу и куратору поддержать первокурсника, испытывающего трудности адаптации?»',
    },
    context: {
      kk: 'Жағдаят: бірінші курс студенті сабақтан жиі қалатын болды, топтастарымен араласуын тоқтатты және оқу қызметіне өте аз қатысады.',
      ru: 'Ситуация: студент первого курса стал часто пропускать занятия, перестал общаться с одногруппниками и практически не участвует в учебной деятельности.',
    },
    question: {
      kk: 'Талқылау сұрағы: «Оқытушы мен куратор ең алдымен қандай әрекеттер жасауы керек?»',
      ru: 'Вопрос для обсуждения: «Какие действия должны предпринять педагог и куратор в первую очередь?»',
    },
    instruction: {
      kk: 'Бір жауап нұсқасын таңдаңыз.',
      ru: 'Выберите один вариант ответа.',
    },
    correctOptionId: 'step_1',
    correctExplanation: {
      kk: 'Ұсынылатын реттілік: 1) Өзгерістердің ықтимал себептерін әдеппен анықтау → 2) Жеке әңгімелесу өткізу → 3) Қажет болған жағдайда педагог-психолог пен басқа мамандарды тарту → 4) Қолдау ұйымдастырып, жағдайдың өзгеруін бақылау.',
      ru: 'Рекомендуемая последовательность действий: 1) Тактично выяснить возможные причины изменений → 2) Провести индивидуальную беседу → 3) При необходимости привлечь педагога-психолога и других специалистов → 4) Организовать поддержку и наблюдать за динамикой ситуации.',
    },
    options: [
      {
        id: 'step_1',
        code: '1',
        label: {
          kk: 'Өзгерістердің ықтимал себептерін әдеппен анықтау.',
          ru: 'Тактично выяснить возможные причины изменений.',
        },
      },
      {
        id: 'step_2',
        code: '2',
        label: {
          kk: 'Жеке әңгімелесу өткізу.',
          ru: 'Провести индивидуальную беседу.',
        },
      },
      {
        id: 'step_3',
        code: '3',
        label: {
          kk: 'Қажет болған жағдайда педагог-психолог пен басқа мамандарды тарту.',
          ru: 'При необходимости привлечь педагога-психолога и других специалистов.',
        },
      },
      {
        id: 'step_4',
        code: '4',
        label: {
          kk: 'Қолдау ұйымдастырып, жағдайдың өзгеруін бақылау.',
          ru: 'Организовать поддержку и наблюдать за динамикой ситуации.',
        },
      },
    ],
  },
};

export const UI_TEXT = {
  collegeLine1: 'Астана қаласы әкімдігінің "Кәсіптік-техникалық колледжі" ШЖҚ МКК',
  collegeLine2: 'ГКП на ПХВ «Профессионально-технический колледж» акимата г. Астаны',
  councilTitle: {
    kk: 'Педкеңес 4.0: Талдаудан нақты шешімдерге',
    ru: 'Педкеңес 4.0: От анализа к конкретным решениям',
  },
  councilSubtitle: {
    kk: 'Цифрлық басымдық · Интерактивті педагогикалық кеңес платформасы',
    ru: 'Цифровой приоритет · Интерактивная платформа педагогического совета',
  },
  nav: {
    home: { kk: 'Басты бет', ru: 'Главная' },
    surveys: { kk: 'Сауалнамалар', ru: 'Опросы и кейсы' },
    projector: { kk: 'Нәтижелер экраны', ru: 'Экран результатов' },
    admin: { kk: 'Әкімші панелі', ru: 'Админ-панель' },
  },
  landing: {
    ctaStart: {
      kk: 'Сауалнамаларға қатысу',
      ru: 'Пройти опросы',
    },
    ctaProjector: {
      kk: 'Нәтижелер экранын ашу',
      ru: 'Открыть экран результатов',
    },
    qrTitle: {
      kk: 'Қатысуға арналған бірыңғай QR-код',
      ru: 'Единый QR-код для участия',
    },
    qrSubtitle: {
      kk: 'Android және iPhone камерасымен сканерлеңіз — қосымша орнату қажет емес.',
      ru: 'Отсканируйте камерой Android или iPhone — установка приложения не требуется.',
    },
    downloadPng: {
      kk: 'QR-кодты PNG жүктеу',
      ru: 'Скачать QR в PNG',
    },
    printQr: {
      kk: 'QR-кодты басып шығару',
      ru: 'Печать QR-кода',
    },
    qrLinkLabel: {
      kk: 'Қатысуға арналған тікелей сілтеме',
      ru: 'Прямая ссылка для участия',
    },
    openLink: {
      kk: 'Ашу',
      ru: 'Открыть',
    },
    copyLink: {
      kk: 'Сілтемені көшіру',
      ru: 'Копировать ссылку',
    },
    copied: {
      kk: 'Көшірілді',
      ru: 'Скопировано',
    },
    instructionsTitle: {
      kk: 'Қатысу нұсқаулығы',
      ru: 'Краткая инструкция для педагогов',
    },
    instructions: [
      {
        kk: '1. Смартфон камерасын QR-кодқа бағыттап, сайттың мобильді нұсқасын ашыңыз.',
        ru: '1. Наведите камеру телефона на QR-код и откройте мобильную версию сайта.',
      },
      {
        kk: '2. Жоғарғы оң жақтан «ҚАЗ | РУС» ауыстырғышы арқылы қолайлы тілді таңдаңыз.',
        ru: '2. Выберите удобный язык в верхней части экрана с помощью переключателя «ҚАЗ | РУС».',
      },
      {
        kk: '3. «Сауалнамаларға қатысу» батырмасын басып, сауалнамалар мен кейстерге жауап беріңіз.',
        ru: '3. Нажмите «Пройти опросы» и ответьте на вопросы и педагогические кейсы.',
      },
      {
        kk: '4. Нәтижелер нақты уақыт режимінде проектор экранында және әкімші панелінде көрсетіледі.',
        ru: '4. Итоги в реальном времени отображаются на экране результатов и в админ-панели.',
      },
    ],
    modulesTitle: {
      kk: 'Кеңес бөлімдері мен күйі',
      ru: 'Разделы педсовета и текущий статус',
    },
    statusOpen: {
      kk: 'Ашық',
      ru: 'Открыт',
    },
    statusClosed: {
      kk: 'Жабық',
      ru: 'Закрыт',
    },
    responsesLabel: {
      kk: 'жауап',
      ru: 'ответов',
    },
    openModule: {
      kk: 'Бөлімге өту',
      ru: 'Перейти',
    },
  },
  surveyActions: {
    submit: {
      kk: 'Жауапты жіберу',
      ru: 'Отправить ответ',
    },
    submitting: {
      kk: 'Сақталуда...',
      ru: 'Сохранение...',
    },
    submittedTitle: {
      kk: 'Жауабыңыз серверде сәтті сақталды',
      ru: 'Ваш ответ успешно сохранён на сервере',
    },
    submittedNote: {
      kk: 'Қатысқаныңызға рақмет! Нәтижелер нақты уақытта жаңартылды.',
      ru: 'Спасибо за участие! Данные учтены в общей статистике.',
    },
    alreadyVoted: {
      kk: 'Сіз бұл раундта жауап бердіңіз',
      ru: 'Вы уже отправили ответ в этом раунде',
    },
    closedNotice: {
      kk: 'Бұл сауалнама қазір әкімші тарапынан жабылған.',
      ru: 'Голосование по этому вопросу сейчас закрыто администратором.',
    },
    maxTwoError: {
      kk: 'Екі нұсқадан артық таңдамаңыз',
      ru: 'Выберите не более двух вариантов',
    },
    selectRequired: {
      kk: 'Жіберу алдында кемінде бір нұсқаны таңдаңыз.',
      ru: 'Пожалуйста, выберите вариант ответа перед отправкой.',
    },
    sequenceIncomplete: {
      kk: 'Барлық 4 әрекетке 1-ден 4-ке дейінгі реттік нөмір беріңіз.',
      ru: 'Назначьте порядковый номер от 1 до 4 для каждого из 4 действий.',
    },
    nextStep: {
      kk: 'Келесі бөлімге өту',
      ru: 'Перейти к следующему вопросу',
    },
    prevStep: {
      kk: 'Алдыңғы сұрақ',
      ru: 'Предыдущий вопрос',
    },
    moveUp: {
      kk: 'Жоғары жылжыту',
      ru: 'Выше',
    },
    moveDown: {
      kk: 'Төмен жылжыту',
      ru: 'Ниже',
    },
    resetOrder: {
      kk: 'Ретті тазарту',
      ru: 'Сбросить порядок',
    },
    selectedCount: {
      kk: 'Таңдалғаны',
      ru: 'Выбрано',
    },
  },
  stats: {
    respondents: {
      kk: 'Дауыс беруге қатысқандардың жалпы саны',
      ru: 'Общее число участников голосования',
    },
    votedTeachersCol: {
      kk: 'Дауыс берген педагогтер саны',
      ru: 'Проголосовало педагогов',
    },
    votes: {
      kk: 'дауыс',
      ru: 'голосов',
    },
    multiChoiceNote: {
      kk: 'Пайыз осы сұраққа жауап берген қатысушылар санынан есептелді.',
      ru: 'Процент рассчитан от общего числа участников голосования.',
    },
    singleChoiceNote: {
      kk: 'Пайыз = нұсқаға дауыс берген педагогтер саны / дауыс беруге қатысқандардың жалпы саны × 100%.',
      ru: 'Процент = количество педагогов, проголосовавших за вариант / общее число участников голосования × 100%.',
    },
    mostPopular: {
      kk: 'Ең танымал нұсқа',
      ru: 'Самый популярный вариант',
    },
    correctMatchRate: {
      kk: 'Дұрыс реттілік үлесі',
      ru: 'Соответствует правильной последовательности',
    },
    sequenceCombinations: {
      kk: 'Таңдалған реттілік нұсқалары',
      ru: 'Выбранные последовательности действий',
    },
    commonErrors: {
      kk: 'Жиі кездескен қателер (орны ауысқан қадамдар)',
      ru: 'Наиболее частые ошибки в порядке действий',
    },
    noData: {
      kk: 'Әзірге жауаптар жоқ',
      ru: 'Пока нет отправленных ответов',
    },
    correctAnswerLabel: {
      kk: 'Дұрыс жауап',
      ru: 'Правильный ответ',
    },
    correctSequenceLabel: {
      kk: 'Дұрыс реттілік',
      ru: 'Правильная последовательность',
    },
    byOptionsTitle: {
      kk: 'Педагогтердің жауаптары — әрекет нұсқалары бойынша (1–4 орындар)',
      ru: 'Ответы педагогов по вариантам действий (распределение по шагам 1–4)',
    },
    capacityLabel: {
      kk: '200 қатысушыға дейін',
      ru: 'до 200 участников',
    },
  },
  projector: {
    modeTitle: {
      kk: 'Проекторға арналған нәтижелер экраны',
      ru: 'Экран результатов для проектора',
    },
    nextQuestion: {
      kk: 'Келесі сұрақ',
      ru: 'Следующий вопрос',
    },
    votingInProgressTitle: {
      kk: 'Дауыс беру жүріп жатыр',
      ru: 'Идёт голосование',
    },
    votingInProgressDesc: {
      kk: 'Қатысушылардың нақты нәтижелері дауыс беру аяқталғаннан кейін немесе әкімші рұқсатымен көрсетіледі.',
      ru: 'Процентное распределение скрыто настройками администратора до завершения голосования.',
    },
    fullscreen: {
      kk: 'Толық экран',
      ru: 'На весь экран',
    },
    exitFullscreen: {
      kk: 'Қалыпты режим',
      ru: 'Обычный режим',
    },
  },
  admin: {
    title: {
      kk: 'Әкімші панелі',
      ru: 'Панель администратора',
    },
    passwordPrompt: {
      kk: 'Басқару панеліне кіру үшін әкімші құпия сөзін енгізіңіз.',
      ru: 'Введите пароль администратора для доступа к управлению и аналитике.',
    },
    passwordPlaceholder: {
      kk: 'Құпия сөз',
      ru: 'Пароль администратора',
    },
    unlockBtn: {
      kk: 'Кіру',
      ru: 'Войти',
    },
    wrongPassword: {
      kk: 'Құпия сөз қате. Қайта тексеріңіз.',
      ru: 'Неверный пароль. Проверьте ввод и повторите попытку.',
    },
    logout: {
      kk: 'Шығу',
      ru: 'Выйти',
    },
    totalParticipants: {
      kk: 'Бірегей қатысушылар',
      ru: 'Уникальных участников',
    },
    totalSubmissions: {
      kk: 'Барлық жіберілген жауаптар',
      ru: 'Всего ответов',
    },
    openPolls: {
      kk: 'Ашық сауалнамалар',
      ru: 'Открытых опросов',
    },
    exportTitle: {
      kk: 'Нәтижелерді экспорттау',
      ru: 'Экспорт итогового отчёта',
    },
    resetAll: {
      kk: 'Барлық жауаптарды нөлдеу',
      ru: 'Сбросить все ответы',
    },
    resetSingle: {
      kk: 'Осы сұрақтың жауаптарын нөлдеу',
      ru: 'Сбросить ответы вопроса',
    },
    resetConfirmTitle: {
      kk: 'Жауаптарды нөлдеуді растаңыз',
      ru: 'Подтверждение сброса ответов',
    },
    resetConfirmBody: {
      kk: 'Ағымдағы раундтың жауаптары нөлденеді. Сұрақ мәтіндері мен сайт баптаулары сақталады. Бұл әрекетті кері қайтару мүмкін емес.',
      ru: 'Все ответы текущего раунда будут сброшены. Тексты вопросов и настройки сайта сохранятся. Вы уверены?',
    },
    confirmReset: {
      kk: 'Иә, нөлдеу',
      ru: 'Да, сбросить ответы',
    },
    cancel: {
      kk: 'Бас тарту',
      ru: 'Отмена',
    },
    openPollBtn: {
      kk: 'Сауалнаманы ашу',
      ru: 'Открыть опрос',
    },
    closePollBtn: {
      kk: 'Сауалнаманы жабу',
      ru: 'Закрыть опрос',
    },
    liveResultsToggle: {
      kk: 'Проекторда тікелей нәтижені көрсету',
      ru: 'Показывать живые результаты на проекторе',
    },
    correctAnswerToggle: {
      kk: 'Дұрыс жауапты көрсету',
      ru: 'Показывать правильный ответ',
    },
    responseLogTitle: {
      kk: 'Соңғы жауаптар журналы (нақты уақыт)',
      ru: 'Журнал отправленных ответов (время и дата)',
    },
  },
} as const;

export const MAX_COUNCIL_CAPACITY = 200;

export function formatTeachersCount(count: number, lang: Language): string {
  if (lang === 'kk') {
    return `${count} педагог`;
  }
  const abs = Math.abs(count) % 100;
  const mod10 = abs % 10;
  if (abs > 10 && abs < 20) return `${count} педагогов`;
  if (mod10 === 1) return `${count} педагог`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} педагога`;
  return `${count} педагогов`;
}

export interface OptionStat {
  optionId: string;
  code?: string;
  label: BilingualText;
  count: number;
  percentage: number;
  isCorrect: boolean;
  positionCounts?: [number, number, number, number];
}

export interface SequencePatternStat {
  sequence: string[];
  label: string;
  count: number;
  percentage: number;
  isCorrect: boolean;
}

export interface SequenceErrorStat {
  position: number;
  expectedStepId: string;
  mostCommonWrongStepId: string;
  wrongCount: number;
  totalAtPosition: number;
}

export interface SurveyAnalytics {
  surveyId: SurveyId;
  totalRespondents: number;
  totalSelections: number;
  optionStats: OptionStat[];
  mostPopularOptionIds: string[];
  sequencePatterns: SequencePatternStat[];
  correctSequenceCount: number;
  correctSequencePercentage: number;
  commonSequenceErrors: SequenceErrorStat[];
}

export function computeSurveyAnalytics(
  surveyId: SurveyId,
  responses: SurveyResponseDoc[]
): SurveyAnalytics {
  const def = SURVEYS[surveyId];
  // Exclude incomplete responses from denominator
  const validResponses = responses.filter((r) => {
    if (def.kind === 'sequence') {
      return Array.isArray(r.sequence) && r.sequence.length === 4;
    }
    if (def.kind === 'multi') {
      return (
        Array.isArray(r.selectedOptions) &&
        r.selectedOptions.length >= 1 &&
        r.selectedOptions.length <= (def.maxSelections ?? 2)
      );
    }
    return Array.isArray(r.selectedOptions) && r.selectedOptions.length === 1;
  });

  const totalRespondents = validResponses.length;

  if (def.kind === 'sequence') {
    const patternCounts = new Map<string, { seq: string[]; count: number }>();
    const correctSeq = def.correctSequence ?? ['step_1', 'step_2', 'step_3', 'step_4'];
    const correctKey = correctSeq.join('>');
    let correctSequenceCount = 0;

    // Positional accuracy & error tracking
    const positionWrongCounts: Array<Map<string, number>> = [
      new Map(),
      new Map(),
      new Map(),
      new Map(),
    ];

    // Step-level frequency of being placed in the right slot + all 4 positions
    const stepRightPositionCount = new Map<string, number>();
    const stepPositionMatrix = new Map<string, [number, number, number, number]>();
    def.options.forEach((o) => {
      stepRightPositionCount.set(o.id, 0);
      stepPositionMatrix.set(o.id, [0, 0, 0, 0]);
    });

    validResponses.forEach((r) => {
      const key = r.sequence.join('>');
      const existing = patternCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        patternCounts.set(key, { seq: r.sequence, count: 1 });
      }
      if (key === correctKey) {
        correctSequenceCount += 1;
      }
      r.sequence.forEach((stepId, idx) => {
        const matrix = stepPositionMatrix.get(stepId);
        if (matrix && idx >= 0 && idx < 4) {
          matrix[idx] += 1;
        }
        if (stepId === correctSeq[idx]) {
          stepRightPositionCount.set(stepId, (stepRightPositionCount.get(stepId) ?? 0) + 1);
        } else {
          positionWrongCounts[idx].set(
            stepId,
            (positionWrongCounts[idx].get(stepId) ?? 0) + 1
          );
        }
      });
    });

    const optionStats: OptionStat[] = def.options.map((opt) => {
      const count = stepRightPositionCount.get(opt.id) ?? 0;
      const percentage = totalRespondents > 0 ? (count / totalRespondents) * 100 : 0;
      return {
        optionId: opt.id,
        code: opt.code,
        label: opt.label,
        count,
        percentage,
        isCorrect: true,
        positionCounts: stepPositionMatrix.get(opt.id) ?? [0, 0, 0, 0],
      };
    });

    const stepIndexMap: Record<string, string> = {
      step_1: '1',
      step_2: '2',
      step_3: '3',
      step_4: '4',
    };

    const sequencePatterns: SequencePatternStat[] = Array.from(patternCounts.values())
      .sort((a, b) => b.count - a.count)
      .map((entry) => ({
        sequence: entry.seq,
        label: entry.seq.map((id) => stepIndexMap[id] ?? id).join(' → '),
        count: entry.count,
        percentage: totalRespondents > 0 ? (entry.count / totalRespondents) * 100 : 0,
        isCorrect: entry.seq.join('>') === correctKey,
      }));

    const commonSequenceErrors: SequenceErrorStat[] = positionWrongCounts
      .map((wrongMap, idx) => {
        let topWrongId = '';
        let topWrongCount = 0;
        wrongMap.forEach((cnt, stepId) => {
          if (cnt > topWrongCount) {
            topWrongCount = cnt;
            topWrongId = stepId;
          }
        });
        return {
          position: idx + 1,
          expectedStepId: correctSeq[idx],
          mostCommonWrongStepId: topWrongId,
          wrongCount: topWrongCount,
          totalAtPosition: totalRespondents,
        };
      })
      .filter((e) => e.wrongCount > 0);

    const correctSequencePercentage =
      totalRespondents > 0 ? (correctSequenceCount / totalRespondents) * 100 : 0;

    return {
      surveyId,
      totalRespondents,
      totalSelections: totalRespondents,
      optionStats,
      mostPopularOptionIds: [],
      sequencePatterns,
      correctSequenceCount,
      correctSequencePercentage,
      commonSequenceErrors,
    };
  }

  // Single or Multi-choice (max 2)
  const counts = new Map<string, number>();
  def.options.forEach((o) => counts.set(o.id, 0));

  let totalSelections = 0;
  validResponses.forEach((r) => {
    // Deduplicate within a single submission just in case
    const uniqueSelected = Array.from(new Set(r.selectedOptions));
    uniqueSelected.forEach((optId) => {
      if (counts.has(optId)) {
        counts.set(optId, (counts.get(optId) ?? 0) + 1);
        totalSelections += 1;
      }
    });
  });

  const optionStats: OptionStat[] = def.options.map((opt) => {
    const count = counts.get(opt.id) ?? 0;
    const percentage = totalRespondents > 0 ? (count / totalRespondents) * 100 : 0;
    return {
      optionId: opt.id,
      code: opt.code,
      label: opt.label,
      count,
      percentage,
      isCorrect: def.correctOptionId === opt.id,
    };
  });

  let maxCount = 0;
  optionStats.forEach((s) => {
    if (s.count > maxCount) maxCount = s.count;
  });
  const mostPopularOptionIds =
    maxCount > 0 ? optionStats.filter((s) => s.count === maxCount).map((s) => s.optionId) : [];

  return {
    surveyId,
    totalRespondents,
    totalSelections,
    optionStats,
    mostPopularOptionIds,
    sequencePatterns: [],
    correctSequenceCount: 0,
    correctSequencePercentage: 0,
    commonSequenceErrors: [],
  };
}
