<template>
    <div class="card">
        <div class="card-body">
            <h5 class="card-title">Catalog Index Layout</h5>
            <h6 class="card-subtitle mb-2 text-muted">
                Please specify how to layout the index for the LibraryBox Catalog.
            </h6>
            <form class="">
                <div class="row">
                    <div class="col form-row">
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

                        <div class="mx-2">
                            <input class="" 
                                type="radio" 
                                name="index-type" 
                                id="exampleRadios4" 
                                value="speaker-genre" 
                                v-model="indexLayout"
                                @click="saveToStore">
                            <label class="form-check-label" for="exampleRadios4">
                                by Speaker and Genre
                            </label>
                        </div>
                    </div>
                </div>
                <div class="row my-2" v-if="indexLayout === 'speaker' || indexLayout === 'speaker-genre'">
                    <div class="col">
                        <div class="form-group">
                            <label for="speakerRoleSelect">Create the speaker index with people having the following roles (select one or more)</label>
                            <select multiple class="form-control" id="speakerRoleSelect" @click="saveToStore" v-model="speakerRoles">
                                <option v-for="role of speakerRoleSet" :key="role">{{role}}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </form>
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
                    : "setFolderDataLoad";
            setTimeout(() => {
                const speakerRoles = this.indexLayout.match(/speaker/)
                    ? [...this.speakerRoles]
                    : [];
                this.$store.commit(mutation, {
                    type: this.indexLayout,
                    speakerRoles
                });
            }, 10);
        }
    }
};
</script>

<style style="scoped" scss>
</style>
