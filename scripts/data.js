export default {
    sorts: [
        {
            key: "",
            text: "Nothing",
            order: 0
        },
        {
            key: "votes",
            text: "Least to greatest votes",
            order: 1
        },
        {
            key: "votes",
            text: "Greatest to least votes",
            order: -1
        },
        {
            key: "epoch",
            text: "Newest to oldest",
            order: -1
        },
        {
            key: "epoch",
            text: "Oldest to newest",
            order: 1
        }
    ],
    tags: [],
    topicSlugs: [
        "math",
        "science",
        "economics-finance-domain",
        "humanities",
        "computing",
        "test-prep",
        "partner-content",
        "college-admissions",
        "talks-and-interviews",
        "coach-res"
    ],
    KA_URL: "https://{{lang}}.khanacademy.org",
    API_PATH: "https://{{lang}}.khanacademy.org/api",
    MAX_BATCH_SIZE: 10,
    MAX_ACTIVE_REQUESTS: 25,
    apiSlugs: {
        topic: "/v1/topic/{{topicSlug}}",
        video: "/v1/videos/{{videoSlug}}",
        clarifications: "/internal/discussions/{{type}}/{{id}}/clarifications"
    },
    slugSort: {
        "college-careers-more": 7,
        "computing": 4,
        "economics-finance-domain": 2,
        "humanities": 3,
        "mappers": 10,
        "math": 0,
        "partner-content": 6,
        "resources": 9,
        "science": 1,
        "talent-search": 11,
        "talks-and-interviews": 8,
        "test-prep": 5
    }
};
