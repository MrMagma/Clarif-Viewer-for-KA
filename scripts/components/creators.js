export function tag(tag, id) {
    return $("<span>")
        .addClass(`cvka-clarif-tag ${tag.color} white-text`)
        .attr("data-tag-id", id)
        .text(tag.name);
}
