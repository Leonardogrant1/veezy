
/*

    - face_front: front facing photo of the user
    - face_left: left facing photo of the user
    - face_right: right facing photo of the user
    - body: full body photo of the user or dream body (optional)
    - composite: merge and compressed version of all photos (for LLM input)

*/

type ReferenceType = 'face_front' | 'face_left' | 'face_right' | 'body' | 'composite' | 'description';

export function getSelfReferenceKey(userId: string, type: ReferenceType): string {
    return `self-reference/${userId}/${type}`;
}
