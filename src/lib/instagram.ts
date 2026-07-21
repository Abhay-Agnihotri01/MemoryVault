export async function fetchInstagramMedia(accessToken: string) {
  try {
    // Debug what permissions we actually got
    const permRes = await fetch(`https://graph.facebook.com/me/permissions?access_token=${accessToken}`);
    const permData = await permRes.json();
    console.log("🟢 GRANTED PERMISSIONS:", JSON.stringify(permData, null, 2));

    const accountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{id,username},name&access_token=${accessToken}`;
    console.log("Fetching accounts from:", accountsUrl.replace(accessToken, "HIDDEN_TOKEN"));
    const accountsRes = await fetch(accountsUrl);
    const accountsData = await accountsRes.json();
    console.log("🔴 RAW FACEBOOK ACCOUNTS DATA:", JSON.stringify(accountsData, null, 2));

    if (accountsData.error) {
      throw new Error(`Facebook API Error: ${accountsData.error.message}`);
    }

    // Find the first page that has an Instagram Business Account linked
    const linkedPage = accountsData.data?.find(
      (page: any) => page.instagram_business_account
    );

    if (!linkedPage) {
      throw new Error(
        "No linked Instagram Professional account found. Please make sure your Instagram account is converted to Professional/Creator and linked to a Facebook Page."
      );
    }

    const igAccountId = linkedPage.instagram_business_account.id;

    // Step 2: Fetch all Media from the Instagram Account (with pagination)
    let mediaItems: any[] = [];
    let nextUrl: string | null = `https://graph.facebook.com/v18.0/${igAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,children{id,media_type,media_url,thumbnail_url}&limit=100&access_token=${accessToken}`;

    while (nextUrl) {
      const mediaRes = await fetch(nextUrl);
      const mediaData: any = await mediaRes.json();

      if (mediaData.error) {
        throw new Error(`Instagram API Error: ${mediaData.error.message}`);
      }

      if (mediaData.data && mediaData.data.length > 0) {
        mediaItems.push(...mediaData.data);
      }

      nextUrl = mediaData.paging?.next || null;
    }

    return mediaItems;
  } catch (error) {
    console.error("Error fetching Instagram media:", error);
    throw error;
  }
}
