<template>
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Catalog Index Configuration</h5>
            <div class="row mt-3">
                <div class="col-6">
                    <div class="row">
                        <div class="col">
                            <label for="">Default index:</label>
                            <div class="mx-2">
                                <input class="" 
                                    type="radio" 
                                    name="index-type" 
                                    id="exampleRadios1" 
                                    value="id" 
                                    v-model="indexLayout"
                                    @click="saveToStore">
                                <label class="form-check-label" for="exampleRadios1">
                                    by Collection / Item Identifiers
                                </label>
                            </div>

                            <div class="mx-2">
                                <input class="" 
                                    type="radio" 
                                    name="index-type" 
                                    id="exampleRadios2" 
                                    value="genre" 
                                    v-model="indexLayout"
                                    @click="saveToStore">
                                <label class="form-check-label" for="exampleRadios2">
                                    by Genre
                                </label>
                            </div>

                            <div class="mx-2">
                                <input class="" 
                                    type="radio" 
                                    name="index-type" 
                                    id="exampleRadios3" 
                                    value="speaker" 
                                    v-model="indexLayout"
                                    @click="saveToStore">
                                <label class="form-check-label" for="exampleRadios3">
                                    by Speaker
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="alert alert-info mt-3" role="alert">
                        In order to create an index by Genre you need to add a note in the <strong>adminComment</strong>
                        field of the item in the form <em>[ genre: {genre name} ::: ]</em>
                    </div>
                </div>
                <div class="col-6">
                    <div class="form-group">
                        <label for="speakerRoleSelect">Create the speaker index with people having the following roles (select one or more):</label>
                        <select multiple class="form-control" id="speakerRoleSelect" @click="saveToStore" v-model="speakerRoles">
                            <option v-for="role of speakerRoleSet" :key="role">{{role}}</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        component: String
    },
    data() {
        return {
            indexLayout: "id",
            speakerRoles: [],
            speakerRoleSet: [
                "annotator",
                "artist",
                "author",
                "compiler",
                "consultant",
                "data_inputter",
                "depositor",
                "developer",
                "editor",
                "illustrator",
                "interviewer",
                "participant",
                "performer",
                "photographer",
                "recorder",
                "researcher",
                "respondent",
                "speaker",
                "signer",
                "singer",
                "sponsor",
                "transcriber",
                "translator"
            ]
        };
    },
    methods: {
        saveToStore() {
            const mutation =
                this.component === "librarybox"
                    ? "setLibraryBoxIndexType"
                    : "setFolderIndexType";
            setTimeout(() => {
                this.$store.commit(mutation, {
                    type: this.indexLayout,
                    speakerRoles: this.speakerRoles
                });
            }, 10);
        }
    }
};
</script>

<style style="scoped" scss>
</style>
