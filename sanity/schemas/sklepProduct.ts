// sanity/schemas/sklepProduct.ts
// Products for the Sklep page.
// productType is the "spine": every product is one of digital / physical / bundle / course.
// WIRED END-TO-END: digital (PDF download), physical (shipped, address collected at
// checkout) and bundle (PDF download + shipped). 'course' is still a placeholder.

import { defineField, defineType } from "sanity";

export default defineType({
  name: "sklepProduct",
  title: "Sklep — Produkty",
  type: "document",
  fields: [
    // ── THE SPINE: what kind of product is this? ──
    defineField({
      name: "productType",
      title: "Typ produktu",
      description:
        'Cyfrowy = PDF do pobrania. Fizyczny = wysyłka pocztą (klient podaje adres przy zakupie). ' +
        'Zestaw = PDF + wysyłka. „Kurs" jeszcze nie działa — nie publikuj.',
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "Cyfrowy — PDF do pobrania", value: "digital" },
          { title: "Fizyczny — wysyłka pocztą", value: "physical" },
          {
            title: "Zestaw — produkt fizyczny + PDF",
            value: "bundle",
          },
          { title: "Kurs (wkrótce)", value: "course" },
        ],
      },
      initialValue: "digital",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "namePl",
      title: "Nazwa produktu (Polski)",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "nameEn",
      title: "Nazwa produktu (English)",
      type: "string",
    }),
    defineField({
      name: "descPl",
      title: "Opis (Polski)",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "descEn",
      title: "Opis (English)",
      type: "text",
      rows: 4,
    }),

    // ── IMAGES: product photos, hosted by Sanity on its own CDN (NOT Supabase). ──
    // Mainly for physical / bundle products. First image = main; the rest = gallery.
    // Hidden for digital products (their visual is the PDF itself).
    defineField({
      name: "images",
      title: "Zdjęcia produktu",
      description:
        "Zdjęcia produktu fizycznego. Pierwsze zdjęcie jest głównym. " +
        "Przeciągnij i upuść lub kliknij, aby przesłać — Sanity hostuje je automatycznie.",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Opis zdjęcia (alt) — dla dostępności i SEO",
              type: "string",
            },
          ],
        },
      ],
      hidden: ({ document }) => document?.productType === "digital",
    }),

    // ── SEARCH: keywords power the shop search box ──
    defineField({
      name: "keywords",
      title: "Słowa kluczowe (wyszukiwarka)",
      description:
        "Słowa, po których klient może znaleźć ten produkt. Dodaj je PO POLSKU I PO ANGIELSKU, " +
        "np.: witaminy, vitamins, energia, energy, odporność, immunity, zmęczenie, fatigue. " +
        "Każde słowo jako osobny tag.",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    defineField({
      name: "priceGBP",
      title: "Cena £ GBP",
      type: "number",
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: "pricePLN",
      title: "Cena zł PLN",
      type: "number",
    }),

    // Flat postage added at checkout for physical / bundle products (in GBP;
    // converted to PLN automatically for Polish orders). Empty = free shipping.
    defineField({
      name: "shippingFeeGBP",
      title: "Koszt wysyłki £ GBP (produkty fizyczne)",
      description:
        "Stała opłata za wysyłkę, doliczana przy zakupie produktów fizycznych i zestawów. " +
        "Zostaw puste = darmowa wysyłka.",
      type: "number",
      hidden: ({ document }) =>
        document?.productType === "digital" ||
        document?.productType === "course",
      validation: (Rule) => Rule.min(0),
    }),

    // fileName is only needed for products that deliver a PDF (digital or bundle).
    defineField({
      name: "fileName",
      title:
        "Nazwa pliku PDF w Supabase Storage (np. przewodnik-energetyczny.pdf)",
      type: "string",
      hidden: ({ document }) => document?.productType === "physical",
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const type = (context.document?.productType as string) ?? "digital";
          if ((type === "digital" || type === "bundle") && !value) {
            return "Wymagane dla produktów cyfrowych (PDF).";
          }
          return true;
        }),
    }),

    defineField({
      name: "deliveryNote",
      title: "Informacja o dostawie (Polski)",
      type: "string",
      initialValue: "PDF · Natychmiastowe pobranie po zakupie",
    }),
    defineField({
      name: "deliveryNoteEn",
      title: "Delivery note (English) — leave empty to reuse Polish",
      type: "string",
    }),
    defineField({
      name: "includes",
      title: "Co zawiera — lista (Polski)",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "includesEn",
      title: "What's included — list (English), leave empty to reuse Polish",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "isActive",
      title: "Aktywny (widoczny w sklepie)?",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "order",
      title: "Kolejność wyświetlania",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "namePl",
      subtitle: "priceGBP",
      type: "productType",
    },
    prepare(selection: Record<string, any>) {
      const typeLabels: Record<string, string> = {
        digital: "PDF",
        physical: "Fizyczny",
        bundle: "Zestaw",
        course: "Kurs",
      };
      const typeLabel = typeLabels[selection.type] ?? "PDF";
      return {
        title: selection.title,
        subtitle: `${typeLabel} · £${selection.subtitle}`,
      };
    },
  },
});
