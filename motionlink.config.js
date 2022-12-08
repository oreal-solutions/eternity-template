// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const markdownService = require("motionlink-cli/lib/services/markdown_service");
const ObjectTransformers = markdownService.ObjectTransformers;
const BlockTransformers = markdownService.BlockTransformers;

let postIndex = 1;
function getNextPostWeight() {
  return postIndex++;
}

let postId = 10_000; // Will never change
function genNextPostId() {
  // Counting down so that new posts don't change the id of those that were already there.
  // Assuming posts are sortedby descending created time.
  return postId--;
}

const allFilter = {
  or: [
    {
      property: "Status",
      select: {
        equals: "Published",
      },
    },
    {
      property: "Status",
      select: {
        equals: "Completed",
      },
    },
    {
      property: "Status",
      select: {
        equals: "Public",
      },
    },
  ],
};

// post
/** @type {import("motionlink-cli/lib/models/config_models").TemplateRule[]} */
const rules = [
  {
    template: "motionlink_templates/content/work/posts/post.md",
    outDir: "content/work/posts",
    writeMediaTo: "assets",
    uses: {
      database: "posts",
      fetchBlocks: true,
      filter: allFilter,
      sort: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      map: (page, context) => {
        page.otherData.weight = getNextPostWeight();
        page._title = `post-${genNextPostId()}`;
        page.otherData.date = page.data.created_time;

        const pageTitle = ObjectTransformers.transform_all(
          // @ts-ignore
          page.data.properties.Title.title
        );
        page.otherData.title = pageTitle;

        if (page.data.properties.Tags.type === "multi_select") {
          const postTags = [];
          for (const tag of page.data.properties.Tags.multi_select) {
            postTags.push(tag.name);
          }

          page.otherData.tags = postTags;
        }

        const defaultImageBlockTransformer = BlockTransformers.image;
        const imageUrls = [];
        BlockTransformers.image = (block, _) => {
          if (block.type === "image") {
            const thumbnailMedia = context.fetchMedia(
              // @ts-ignore
              block.image
            );

            imageUrls.push(`/${thumbnailMedia.src}`);
          }

          return "";
        };

        page.otherData.markdown = context.genMarkdownForBlocks(page.blocks);
        BlockTransformers.image = defaultImageBlockTransformer;
        page.otherData.images = imageUrls;
        return page;
      },
    },
    alsoUses: [],
  },

  // content/_index
  {
    template: "motionlink_templates/content/_index.md",
    outDir: "content",
    uses: {
      database: "profile",
      sort: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      takeOnly: 1,
      fetchBlocks: false,
      filter: allFilter,
      map: (page, _) => {
        page._title = "_index";
        const subtitleText = ObjectTransformers.transform_all(
          page.data.properties.Subtitle.rich_text
        );
        page.otherData.subtitleItems = subtitleText.split(".");
        return page;
      },
    },
    alsoUses: [],
  },

  // about
  {
    template: "motionlink_templates/content/about.md",
    outDir: "content",
    uses: {
      database: "profile",
      sort: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      takeOnly: 1,
      fetchBlocks: true,
      filter: allFilter,
      map: (page, context) => {
        page._title = "about";
        page.otherData.markdown = context.genMarkdownForBlocks(page.blocks);
        return page;
      },
    },
    alsoUses: [],
  },

  // config
  {
    template: "motionlink_templates/config.yaml",
    outDir: ".",
    uses: {
      database: "profile",
      sort: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
      takeOnly: 1,
      fetchBlocks: false,
      filter: allFilter,
      map: (page, context) => {
        page._title = "config";
        page.otherData.NETLIFY_SITE_URL = process.env.NETLIFY_SITE_URL;
        console.log(process.env.NETLIFY_SITE_URL);
        page.otherData = {
          ...page.otherData,
          ...context.others.siteConfiguration.pages[0].otherData,
        };

        page.otherData.subtitle = ObjectTransformers.transform_all(
          page.data.properties.Subtitle.rich_text
        );

        const socials = [];

        if (page.data.properties.Email?.type === "rich_text") {
          const email = ObjectTransformers.transform_all(
            // @ts-ignore
            page.data.properties.Email.rich_text
          );

          socials.push({
            icon: "far fa-envelope fa-lg",
            url: `mailto:${email}`,
          });
        }

        if (page.data.properties.Instagram?.type === "url") {
          const instagram = page.data.properties.Instagram.url;

          socials.push({
            icon: "fab fa-instagram fa-lg",
            url: instagram,
          });
        }

        if (page.data.properties.YouTube?.type === "url") {
          const youtube = page.data.properties.YouTube.url;

          socials.push({
            icon: "fab fa-youtube fa-lg",
            url: youtube,
          });
        }

        if (page.data.properties.LinkedIn?.type === "url") {
          const linkedin = page.data.properties.LinkedIn.url;

          socials.push({
            icon: "fab fa-linkedin fa-lg",
            url: linkedin,
          });
        }

        let nextMenuWeight = 1;
        const menuItems = [
          {
            name: "work",
            url: "/work/",
            weight: nextMenuWeight++,
          },
        ];

        let flatTags = context.others.posts.pages
          .map((el) => el.otherData.tags)
          .flat();

        for (const tag of new Set(flatTags)) {
          menuItems.push({
            name: tag,
            url: `/tags/${tag}/`,
            weight: nextMenuWeight++,
          });
        }

        menuItems.push({
          name: "about",
          url: "/about/",
          weight: nextMenuWeight++,
        });

        page.otherData.socials = socials;
        page.otherData.menuItems = menuItems;
        return page;
      },
    },

    alsoUses: [
      {
        database: "siteConfiguration",
        fetchBlocks: false,
        filter: allFilter,
        map: (page, _) => {
          page.otherData.author = ObjectTransformers.transform_all(
            page.data.properties.Author.rich_text
          );
          page.otherData.googleAnalyticsId = ObjectTransformers.transform_all(
            page.data.properties.GoogleAnalyticsId.rich_text
          );
          page.otherData.plausibleAnalyticsId =
            ObjectTransformers.transform_all(
              page.data.properties.PlausibleAnalyticsId.rich_text
            );
          page.otherData.siteTitle = ObjectTransformers.transform_all(
            page.data.properties.SiteTitle.rich_text
          );

          return page;
        },
      },

      {
        database: "posts",
        fetchBlocks: false,
        filter: allFilter,
        map: (page, _) => {
          const postTags = [];
          for (const tag of page.data.properties.Tags.multi_select) {
            postTags.push(tag.name);
          }

          page.otherData.tags = postTags;
          return page;
        },
      },
    ],
  },
];

module.exports = rules;
