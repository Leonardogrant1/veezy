const de: Record<string, string> = {
  // Common
  'common.continue': 'Weiter',
  'common.error_generic': 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',

  // Start screen
  'start.title': "Dein AI\nVision Board",
  'start.subtitle': "Tägliche Motivation.\nDeine Ziele im Blick.",
  'start.cta': 'Loslegen',

  // Onboarding — emotion slides
  // Science step (Matthews 2015, Zielerreichung)
  'onboarding.science.title': 'Wer seine Ziele sieht, erreicht sie',
  'onboarding.science.body': 'Tägliche Signale halten dein Unterbewusstsein auf dein Ziel ausgerichtet — das prägt deine Entscheidungen, und deine Entscheidungen prägen dein Ergebnis. In einer Studie erreichten Menschen, die ihre Ziele im Blick behielten, sie fast doppelt so oft.',
  'onboarding.science.bar_without': 'Ziele nur im Kopf',
  'onboarding.science.bar_with': 'Ziele im Blick',
  'onboarding.science.source': 'Dr. Gail Matthews (2015), Dominican University of California — Studie zur Zielerreichung mit 267 Teilnehmenden.',

  // Attribution step
  'onboarding.attribution.title': 'Wo hast du von uns gehört?',
  'onboarding.attribution.subtitle': 'Das hilft uns zu verstehen, wie Leute veezy finden.',
  'onboarding.attribution.friends': 'Freunde & Familie',
  'onboarding.attribution.other': 'Sonstiges',

  // Referral code step
  'onboarding.referral.headline': 'Hast du einen Creator-Code?',
  'onboarding.referral.subtitle': 'Optional — du kannst diesen Schritt überspringen.',
  'onboarding.referral.placeholder': 'CODE',
  'onboarding.referral.submit': 'Einlösen',
  'onboarding.referral.success': 'Code eingelöst!',
  'onboarding.referral.error_not_found': 'Code nicht gefunden',
  'onboarding.referral.error_network': 'Etwas ist schiefgelaufen. Versuch es noch mal.',

  // Age step
  'onboarding.age.title': 'Wie alt bist du?',
  'onboarding.age.subtitle': 'Damit wir veezy besser auf dich zuschneiden können.',
  'onboarding.age.under_18': 'Unter 18',

  // Name step
  'onboarding.name.headline': "Wie sollen wir\ndich nennen?",
  'onboarding.name.placeholder': 'Dein Name',

  // Vision step
  'onboarding.vision.headline_with_name': "{{name}}, was ist deine Vision?",
  'onboarding.vision.headline': "Was ist deine Vision?",
  'onboarding.vision.subtitle': 'Beschreibe kurz, wo du in ein paar Jahren stehst.',
  'onboarding.vision.placeholder': 'Ein Haus am Meer, finanzielle Freiheit…',

  // Photo bridge step
  'onboarding.photo_bridge.teaser': 'Stell dir vor…',
  'onboarding.photo_bridge.headline': "du siehst dich selbst\ngenau dort.",
  'onboarding.photo_bridge.subtext': "Nicht irgendein Bild.\nSondern dich.",
  'onboarding.photo_bridge.continue': 'Zeig es mir',

  // Photo upload step
  'onboarding.photo_upload.title': 'Deine Fotos',
  'onboarding.photo_upload.subtitle': 'Diese Bilder werden genutzt, um dich in deiner Vision darzustellen. Lade Fotos aus verschiedenen Perspektiven hoch.',
  'onboarding.photo_upload.slot_front': 'Frontal',
  'onboarding.photo_upload.slot_front_hint': 'Gerade in die Kamera',
  'onboarding.photo_upload.slot_smile': 'Lächelnd',
  'onboarding.photo_upload.slot_smile_hint': 'Natürliches Lächeln',
  'onboarding.photo_upload.slot_left': 'Links',
  'onboarding.photo_upload.slot_left_hint': 'Kopf leicht links',
  'onboarding.photo_upload.slot_right': 'Rechts',
  'onboarding.photo_upload.slot_right_hint': 'Kopf leicht rechts',
  'onboarding.photo_upload.slot_body': 'Körper (optional)',
  'onboarding.photo_upload.slot_body_hint': 'Hilft uns, auch deinen Körper realistisch zu matchen.',
  'onboarding.photo_upload.continue': 'Kreiere meine Vision!',
  'onboarding.photo_upload.consent_label': 'Ich stimme zu ',
  'onboarding.photo_upload.consent_link': 'KI-Bildverarbeitung',
  'onboarding.photo_upload.ai_info_title': 'KI-Bildverarbeitung',
  'onboarding.photo_upload.ai_info_body': 'Um dein personalisiertes Vision Board zu erstellen, sendet Veezy sicher:\n\n• Deine hochgeladenen Fotos\n• Deine Vision-Beschreibungen\n\nan Google Vertex AI zur KI-Bildgenerierung.\n\nDeine Daten werden ausschließlich für diese Funktion verwendet und niemals verkauft oder für Werbung genutzt.',
  'onboarding.photo_upload.ai_info_close': 'Verstanden',

  // Tracking step
  'onboarding.tracking.label': 'DATENSCHUTZ',
  'onboarding.tracking.headline': "Deine Vision gehört dir.\nUnsere Daten bleiben anonym.",
  'onboarding.tracking.subtitle': 'Wir tracken nur wie du die App nutzt — nie was du schreibst, nie wer du bist.',
  'onboarding.tracking.badge_no_data': 'Null persönliche Daten erfasst',
  'onboarding.tracking.badge_no_selling': 'Nie verkauft. Nie geteilt.',
  'onboarding.tracking.badge_insights': 'Nur um veezy für dich zu verbessern',

  // Vision generation step
  'onboarding.vision_generation.error_title': 'Etwas ist schiefgelaufen',
  'onboarding.vision_generation.error_sub': 'Deine Vision wird später generiert.',
  'onboarding.vision_generation.continue': 'Weiter',

  // Vision reaction step
  'onboarding.reaction.headline': "Wie fühlt sich\ndas an?",
  'onboarding.reaction.want_it': 'Ich will das',
  'onboarding.reaction.wild': 'Krass zu sehen',
  'onboarding.reaction.good': 'Fühlt sich gut an',
  'onboarding.reaction.not_yet': "Noch nicht ganz meins",

  // Notification setup step
  'onboarding.notifications.title': 'Wann sollen wir dich erinnern?',
  'onboarding.notifications.subtitle': 'Stell ein, wann und wie oft veezy dich an deine Ziele erinnern soll.',
  'onboarding.notifications.section_frequency': 'Häufigkeit & Zeitraum',
  'onboarding.notifications.per_day': 'Pro Tag',
  'onboarding.notifications.start_time': 'Startzeit',
  'onboarding.notifications.end_time': 'Endzeit',
  'onboarding.notifications.summary': '{{count}}x täglich zwischen {{start}} und {{end}}',
  'onboarding.notifications.section_style': 'Motivationsstil',
  'onboarding.notifications.style_affirmation_label': 'Affirmation',
  'onboarding.notifications.style_affirmation_desc': 'Positive Bestätigung & ruhige Stärke',
  'onboarding.notifications.style_fuel_label': 'Fuel',
  'onboarding.notifications.style_fuel_desc': 'Dringlichkeit & knallharter Antrieb',
  'onboarding.notifications.test_button': 'Test-Benachrichtigung senden',
  'onboarding.notifications.test_sent': 'Gesendet — schau gleich rein!',
  'onboarding.notifications.fallback_affirmation': '"Ich lebe in meinem Traumhaus am Meer und bin vollkommen frei."',
  'onboarding.notifications.fallback_fuel': '"Jetzt alles geben – oder für immer davon träumen."',

  'onboarding.demo.badge': 'So funktioniert Veezy',
  'onboarding.demo.photos_title': 'Du machst mind. 4 schnelle Selfies',
  'onboarding.demo.photos_subtext': 'Mit ihnen setzen wir dich selbst in deine Visionen – so realistisch wie möglich. Zum Beispiel so:',
  'onboarding.demo.photos_cta': 'Weiter',
  'onboarding.demo.typing_title': 'Beschreibe deine Vision',
  'onboarding.demo.figure_cta': 'Visionsbild erstellen',
  'onboarding.demo.vision_text': 'Ich lebe in meinem Traumhaus am Meer und bin vollkommen frei.',
  'onboarding.demo.example_badge': 'BEISPIEL',
  'onboarding.demo.phrase': 'Ich lebe in meinem Traumhaus am Meer und genieße meine Freiheit.',
  'onboarding.demo.category': 'Lifestyle',
  'onboarding.demo.continue': 'Weiter',
  'onboarding.demo.widget_badge': 'Das Veezy Widget',
  'onboarding.demo.widget_title': 'Deine Vision. Als Widget auf deinem Homescreen.',
  'onboarding.demo.widget_subtitle': 'Jeden Tag, bei jedem Blick aufs Handy.',

  // Notification explain step
  'onboarding.notification_explain.title': 'Wir erinnern dich an deine Vision',
  'onboarding.notification_explain.subtitle': 'Kleine Impulse über den Tag verteilt – wann es dir passt.',
  'onboarding.notification_explain.banner_time': 'jetzt',

  // Personalization step
  'onboarding.personalization.title': 'Wir richten veezy für dich ein',
  'onboarding.personalization.title_with_name': '{{name}}, wir richten veezy für dich ein',
  'onboarding.personalization.stage_profile': 'Profil wird erstellt…',
  'onboarding.personalization.stage_visions': 'Deine Visionen werden zugeschnitten…',
  'onboarding.personalization.stage_reminders': '{{perDay}}× tägliche Erinnerungen werden geplant…',
  'onboarding.personalization.stage_widget': 'Dein Widget wird vorbereitet…',
  'onboarding.personalization.stage_done': 'Alles bereit!',

  // Trial step (timeline)
  'onboarding.trial.title': "3 Tage kostenlos.\nKein Risiko.",
  'onboarding.trial.subtitle': 'Wir geben dir vollen Zugang zu veezy Premium — damit du selbst spürst, was möglich ist.',
  'onboarding.trial.timeline_0_title': 'Heute',
  'onboarding.trial.timeline_0_body': 'Dein kostenloser Zugang beginnt — alles freigeschaltet.',
  'onboarding.trial.timeline_1_title': 'Tag 2',
  'onboarding.trial.timeline_1_body': 'Wir erinnern dich, bevor dein Test endet.',
  'onboarding.trial.timeline_2_title': 'Tag 3',
  'onboarding.trial.timeline_2_body': 'Abo beginnt — jederzeit kündbar.',
  'onboarding.trial.badge': 'Keine versteckten Kosten. Jederzeit in den iPhone-Einstellungen kündbar.',
  'onboarding.trial.cta': "Los geht's!",

  // Home screen
  'home.empty_title': 'Erstelle deine erste Vision',
  'home.empty_subtitle_pre': 'Tippe auf das',
  'home.empty_subtitle_post': 'um deine erste Vision zu erstellen',

  // Vision slide
  'vision.slide.generating': 'Dein Bild wird erstellt…',
  'vision.slide.generating_update': 'Neues Bild wird erstellt…',
  'vision.slide.failed': 'Bild konnte nicht erstellt werden. Versuch es über das Menü erneut.',
  'vision.slide.premium_unlock': 'Premium freischalten',

  // Vision add screen
  'vision.add.headline': 'Beschreibe deine Vision',
  'vision.add.placeholder': 'Ein Haus am Meer, Freiheit, Erfolg…',
  'vision.add.error': 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  'vision.add.figure_gate_title': 'Deine Vision braucht dich',
  'vision.add.figure_gate_text': 'Mach ein paar schnelle Selfies, damit wir dich in deine Zukunft setzen können – so realistisch, als wärst du schon dort.',
  'vision.add.figure_gate_button': 'Selfies machen',
  'vision.add.share_instagram': 'In Instagram Story teilen',
  'vision.add.share': 'Teilen',
  'vision.add.regenerate': 'Neu generieren',

  // Vision actions modal
  'vision.actions.title': 'Vision Optionen',
  'vision.actions.share_instagram': 'In Instagram Story teilen',
  'vision.actions.share': 'Teilen',
  'vision.actions.edit_phrase': 'Phrase bearbeiten',
  'vision.actions.regenerate': 'Bild neu generieren',
  'vision.actions.delete': 'Vision löschen',
  'vision.actions.delete_confirm_title': 'Vision löschen?',
  'vision.actions.delete_confirm_message': 'Diese Aktion kann nicht rückgängig gemacht werden.',
  'vision.actions.delete_confirm_cancel': 'Abbrechen',
  'vision.actions.delete_confirm_ok': 'Löschen',
  'vision.actions.regen_confirm_title': 'Bild neu generieren?',
  'vision.actions.regen_confirm_message': 'Ein neues Bild wird für diese Vision erstellt.',
  'vision.actions.regen_confirm_cancel': 'Abbrechen',
  'vision.actions.regen_confirm_ok': 'Generieren',
  'vision.actions.regen_error': 'Generierung fehlgeschlagen. Bitte versuche es erneut.',

  // Settings screen
  'settings.section_settings': 'Einstellungen',
  'settings.section_legal': 'Rechtliches',
  'settings.self_reference_title': 'Referenzbilder',
  'settings.self_reference_subtitle': 'Fotos für personalisierte Visionen',
  'settings.premium_title': 'Veezy Premium',
  'settings.premium_subtitle': 'Alle Features freischalten',
  'settings.row_name': 'Name',
  'settings.row_birthday': 'Geburtstag',
  'settings.row_notifications': 'Benachrichtigungen',
  'settings.row_subscription': 'Abo verwalten',
  'settings.row_tutorial': 'Tutorial wiederholen',
  'settings.row_request_feature': 'Feature anfragen',
  'settings.row_report_bug': 'Bug melden',
  'settings.row_haptics': 'Haptik',
  'settings.row_language': 'Sprache',
  'settings.legal_terms': 'Nutzungsbedingungen',
  'settings.legal_privacy': 'Datenschutz',
  'settings.edit_name_title': 'Name',
  'settings.edit_name_placeholder': 'Dein Name',

  // Categories
  'category.all': 'Alle',
  'category.wealth': 'Wohlstand',
  'category.body': 'Körper',
  'category.lifestyle': 'Lifestyle',
  'category.relationships': 'Beziehungen',
  'category.mindset': 'Mindset',
  'category.purpose': 'Lebenssinn',
  'category_modal.title': 'Kategorie',

  // Tutorial overlay
  'tutorial.tap_to_continue': 'Tippe um fortzufahren',
  'tutorial.welcome.title': 'Willkommen bei veezy',
  'tutorial.welcome.body': 'Dein persönliches Vision Board. KI-generierte Bilder, die dich täglich an deine Ziele erinnern.',
  'tutorial.welcome.cta': "Los geht's",
  'tutorial.notifications.title': 'Tägliche Erinnerungen',
  'tutorial.notifications.body': 'Wir halten dich auf Kurs mit täglichen Erinnerungen an deine Visionen.',
  'tutorial.notifications.cta': 'Weiter',
  'tutorial.widget.title': 'Dein veezy Widget',
  'tutorial.widget.body': 'Füge das Widget deinem Homescreen hinzu — so hast du deine Vision immer im Blick, auch ohne die App zu öffnen.',
  'tutorial.widget.cta': 'Weiter',
  'tutorial.ready.title': 'Du bist bereit.',
  'tutorial.ready.body': 'Erstelle jetzt deine erste Vision und starte durch.',
  'tutorial.ready.cta': 'Erste Vision erstellen',
  'tutorial.step1.title': 'Deine Vision',
  'tutorial.step1.body': 'Sieh dein zukünftiges Leben — nicht als Idee, sondern als Realität. Deine Vision, jeden Tag vor deinen Augen.',
  'tutorial.step1.cta': 'Weiter',
  'tutorial.step2.title': 'Bearbeite deine Vision',
  'tutorial.step2.body': 'Tippe auf deine Vision, um sie zu bearbeiten, zu teilen oder eine neue Version deines Lebens zu erschaffen.',
  'tutorial.step2.cta': 'Weiter',
  'tutorial.step3.title': 'Wische durch deine Visionen',
  'tutorial.step3.body': 'Ein Swipe nach oben und du tauchst in dein nächstes Zukunftsbild ein — Schritt für Schritt näher an dein Ziel.',
  'tutorial.step3.cta': 'Weiter',
  'tutorial.step4.title': 'Bringe deine Vision zum Leben',
  'tutorial.step4.body': 'Beschreibe, was du willst — und sieh dich selbst genau dort. Deine Zukunft beginnt hier.',
  'tutorial.step4.cta': 'Weiter',
  'tutorial.step5.title': 'Wähle eine Kategorie',
  'tutorial.step5.body': 'Wähle, worauf du dich konzentrierst — Erfolg, Körper, Mindset. Dein Fokus bestimmt dein Leben.',
  'tutorial.step5.cta': 'Weiter',
  'tutorial.step6.title': 'Dein System',
  'tutorial.step6.body': 'Gestalte deine Umgebung so, dass sie dich jeden Tag daran erinnert, wer du werden willst.',
  'tutorial.step6.cta': 'Weiter',

  // Vision loading screen
  'vision_loading.message_1': 'Deine Vision wird erschaffen...',
  'vision_loading.message_2': 'KI analysiert deine Zukunft...',
  'vision_loading.message_3': 'Das Universum arbeitet für dich...',
  'vision_loading.message_4': 'Dein Bild nimmt Form an...',
  'vision_loading.message_5': 'Visualisiere. Manifestiere. Lebe.',
  'vision_loading.message_6': 'Deine Zukunft existiert bereits...',
  'vision_loading.subtext': 'Das kann einige Sekunden dauern',

  // Support ticket modal
  'support.section_label': 'Support',
  'support.row_create_ticket': 'Support-Ticket erstellen',
  'support.modal_title': 'Support',
  'support.field_title': 'Betreff',
  'support.field_title_placeholder': 'Worum geht es?',
  'support.field_description': 'Beschreibung',
  'support.field_description_placeholder': 'Beschreibe dein Anliegen ausführlich...',
  'support.submit': 'Ticket erstellen',
  'support.close': 'Schließen',
  'support.error': 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  'support.success_title': 'Ticket erstellt',
  'support.success_subtitle': 'Wir haben deine Nachricht erhalten und melden uns so schnell wie möglich.',

  // Premium welcome modal
  'premium_welcome.title': 'Willkommen bei Premium',
  'premium_welcome.subtitle': 'Gestalte deine Zukunft und fange an, sie jeden Tag zu visualisieren.',
  'premium_welcome.cta': 'Weiter',

  // Edit self-reference screen
  'edit_self_reference.subtitle': 'Diese Bilder werden genutzt, um dich in deinen Visionen darzustellen. Lade ein Foto aus vier Perspektiven hoch.',
  'edit_self_reference.save': 'Speichern',
  'edit_self_reference.save_error': 'Fehler beim Speichern',

  // Version / Updates
  'version.force_update_title': 'Update erforderlich',
  'version.force_update_body': 'Diese Version von Veezy wird nicht mehr unterstützt. Bitte aktualisiere die App, um fortzufahren.',
  'version.update_available_title': 'Update verfügbar',
  'version.whats_new': 'Was ist neu',
  'version.update_now': 'Jetzt aktualisieren',
  'version.update_later': 'Später',
};

export default de;
