import Vue from 'vue';

export default {
  namespaced: true,

  state: {
    uploadPassRequired: false,
    uploadPass: null,

  },

  mutations: {
    SET(state, val) {
      for (let k in val) {
        Vue.set(state, k, val[k]);
      }
    }
  },

  actions: {
    fetch({commit, state}) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'config.json');

        // Allow using query string to set upload pass
        const params = new URLSearchParams(window.location.search);
        const querystringUploadPass = params.get("upload_key");

        if (querystringUploadPass) {
          state.uploadPass = querystringUploadPass;
          params.delete("upload_key"); // Remove the parameter

          // Build the new URL
          const newUrl =
              params.toString().length > 0
                  ? window.location.pathname + "?" + params.toString()
                  : window.location.pathname; // Remove "?" if no other params exist

          // Update the URL without reloading
          window.history.replaceState(null, "", newUrl);
        }

        state.uploadPass && xhr.setRequestHeader('x-passwd', state.uploadPass);
        xhr.onload = () => {
          if(xhr.status === 200) {
            try {
              const conf = JSON.parse(xhr.responseText);
              commit('SET', conf);
              commit('upload/RETENTION', conf.defaultRetention, {root:true});
            }
            catch(e) {
              commit('ERROR', `Config parse Error: ${e.message}`, {root: true});
            }
          }
          else if (xhr.status === 401 || xhr.status === 403) {
            commit('SET', {uploadPassRequired: true, uploadPass: null});
            const e = new Error('Password required');
            e.code = "PWDREQ";
            reject(e);
          }
          else {
            commit('ERROR', `Config load error: ${xhr.status} ${xhr.statusText}`, {root: true});
          }
          resolve();
        };
        xhr.send();
      });
    }
  }
}
