// Define a generic customer interface to avoid circular dependencies
interface CustomerData {
  name?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  vatNumber?: string | null;
}

interface BusinessData {
  name?: string | null;
  countryCode?: string | null;
}

interface UserData {
  email?: string | null;
  fullName?: string | null;
}

export const transformBusinessToContent = (
  business?: BusinessData | null,
  user?: UserData | null,
) => {
  if (!business?.name && !user?.email && !user?.fullName) return null;

  const content = [];

  if (business?.name) {
    content.push({
      type: "paragraph",
      content: [{ text: business.name, type: "text" }],
    });
  }

  if (user?.email) {
    content.push({
      type: "paragraph",
      content: [{ text: user.email, type: "text" }],
    });
  }

  if (business?.countryCode) {
    content.push({
      type: "paragraph",
      content: [{ text: business.countryCode, type: "text" }],
    });
  }

  return content.length > 0 ? { type: "doc", content } : null;
};

export const transformCustomerToContent = (customer?: CustomerData | null) => {
  if (!customer) return null;

  const content = [];

  if (customer.name) {
    content.push({
      type: "paragraph",
      content: [
        {
          text: customer.name,
          type: "text",
        },
      ],
    });
  }

  if (customer.addressLine1) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.addressLine1, type: "text" }],
    });
  }

  if (customer.addressLine2) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.addressLine2, type: "text" }],
    });
  }

  if (customer.zip || customer.city) {
    content.push({
      type: "paragraph",
      content: [
        {
          text: `${customer.zip || ""} ${customer.city || ""}`.trim(),
          type: "text",
        },
      ],
    });
  }

  if (customer.country) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.country, type: "text" }],
    });
  }

  if (customer.email) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.email, type: "text" }],
    });
  }

  if (customer.phone) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.phone, type: "text" }],
    });
  }

  if (customer.vatNumber) {
    content.push({
      type: "paragraph",
      content: [{ text: customer.vatNumber, type: "text" }],
    });
  }

  return {
    type: "doc",
    content,
  };
};
