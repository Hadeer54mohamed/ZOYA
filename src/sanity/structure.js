// https://www.sanity.io/docs/structure-builder-cheat-sheet
const SINGLETON_IDS = ["shippingSettings"];

export const structure = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Shipping governorates")
        .id("singleton-shippingSettings")
        .child(
          S.document()
            .schemaType("shippingSettings")
            .documentId("shippingSettings")
            .title("Shipping governorates")
        ),
      ...S.documentTypeListItems().filter(
        (listItem) => !SINGLETON_IDS.includes(listItem.getId())
      ),
    ]);
