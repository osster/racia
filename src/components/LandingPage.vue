<template>
  <div id="wrapper">
    <main>
      <div class="md-layout md-gutter md-alignment-center-center">
        <div class="md-layout-item">
          <p id="title" class="md-headline">Генератор частот</p>
        </div>
      </div>
      <div class="md-layout md-gutter">
        <div class="md-layout-item md-layout md-gutter">
          <div class="md-layout-item">
            <md-field>
              <label>от, МГц</label>
              <md-input v-model="diapazon.from"></md-input>
            </md-field>
            <md-field>
              <label>до, МГц</label>
              <md-input v-model="diapazon.to"></md-input>
            </md-field>
            <md-field>
              <label>поддиапазонов, шт</label>
              <md-input v-model="diapazon.sub"></md-input>
            </md-field>
          </div>
          <div class="md-layout-item">
            <md-field>
              <label>неиспользуемая часть(бланк), МГц</label>
              <md-input v-model="diapazon.blank"></md-input>
            </md-field>
            <md-field>
              <label>ширина между каналами, МГц</label>
              <md-input v-model="diapazon.channelStep"></md-input>
            </md-field>
            <md-field>
              <label>seed для псевдогенерации</label>
              <md-input v-model="seed"></md-input>
            </md-field>
          </div>
          <div class="md-layout-item">
            <md-list>
              <md-list-item to="/components/list/router/1">
                ширина поддиапазона <code>{{ subDiapazonWidth }} МГц</code>
              </md-list-item>
              <md-list-item to="/components/list/router/2">
                каналов в поддиапазоне <code>{{ subDiapazonChannelsCount }} шт</code>
              </md-list-item>
            </md-list>
            <md-button
                class="md-raised md-primary"
                @click="save"
            >Сохранить</md-button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="state" id="preview">
      <p class="md-subheading">Предпросмотр (первые 10 строк)</p>
      <pre>{{ drawTable(10) }}</pre>
      ...
    </div>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js';

// const { dialog, getCurrentWindow } = require('electron').remote;
// const fs = require('fs');

export default {
  name: 'landing-page',
  components: {},
  data() {
    return {
      state: false,
      seed: 'Слава Украине',
      diapazon: {
        from: 400,
        to: 470,
        sub: 16,
        blank: 0.02,
        channelStep: 0.003,
      },
      channels: [],
      table: [],
    };
  },
  computed: {
    subDiapazonWidth() {
      return ((this.diapazon.to - this.diapazon.from) / this.diapazon.sub) - this.diapazon.blank;
    },
    subDiapazonChannelsCount() {
      return Math.floor(this.subDiapazonWidth / this.diapazon.channelStep);
    },
    decimalSeed() {
      const md5 = CryptoJS.MD5(this.seed).toString().substring(24);
      const num = parseInt(md5, 16);
      const size = num.toString(10).length;
      const x = 10 ** (size - 1);
      return x / num;
    },
    sort() {
      const sort = [];
      for (let subCh = 0; subCh < parseInt(this.subDiapazonChannelsCount, 10); subCh += 1) {
        sort[subCh] = this.strToInt(`${subCh + this.seed}`);
      }
      return sort;
    },
    tableHead() {
      const head = ['N'];
      for (let ch = 0; ch < parseInt(this.diapazon.sub, 10); ch += 1) {
        head.push(`ch${ch + 1}`);
      }
      return head;
    },
  },
  watch: {
    seed() {
      this.generate();
    },
    diapazon: {
      handler() {
        this.generate();
      },
      deep: true,
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.generate();
    });
  },
  methods: {
    strToInt(str) {
      const md5 = CryptoJS.MD5(str).toString().substring(24);
      const num = parseInt(md5, 16);
      const size = num.toString(10).length;
      const x = 10 ** (size - 1);
      return x / num;
    },
    compare(a, b) {
      if (a.sort < b.sort) {
        return -1;
      } else if (a.sort > b.sort) {
        return 1;
      }
      return 0;
    },
    generate() {
      this.state = false;
      for (let ch = 0; ch < parseInt(this.diapazon.sub, 10); ch += 1) {
        this.channels[ch] = [];
        const subDiapazonStart = parseFloat(this.diapazon.from) +
            (parseFloat(this.subDiapazonWidth) * ch);
        for (let subCh = 0; subCh < parseInt(this.subDiapazonChannelsCount, 10); subCh += 1) {
          const rawValue = subDiapazonStart + (subCh * parseFloat(this.diapazon.channelStep));
          const value = Math.floor(parseFloat(rawValue) * 1000).toString(10);
          const fullSize = value.toString(10).length;
          const baseSize = fullSize - 3;
          this.channels[ch][subCh] = {
            sort: this.sort[subCh],
            value: `${value.substring(0, baseSize)}.${value.substring(baseSize, fullSize)}`,
          };
        }
        this.channels[ch].sort(this.compare).map(i => i.value);
      }
      this.$nextTick(() => {
        this.state = true;
      });
    },
    open(link) {
      this.$electron.shell.openExternal(link);
    },
    async save() {
      const options = {
        title: 'Сохранить каналы',
        defaultPath: 'chennels',
        buttonLabel: 'Сохранить',

        filters: [
          { name: 'txt', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      };
      await window.electronAPI.saveFile(options, this.drawTable());
    },
    drawTable(cols) {
      if (this.channels.length === 0) {
        return false;
      }
      const sizes = [];
      for (let ch = 0; ch < parseInt(this.diapazon.sub, 10); ch += 1) {
        sizes[ch] = this.getSubCannelCharsSize(this.channels[ch]);
      }
      const numColSize = `${this.subDiapazonChannelsCount}`.length;
      // Draw header
      let output = '| ';
      for (let i = 0; i < numColSize - 1; i += 1) {
        output += ' ';
      }
      output += 'N |';
      for (let ch = 0; ch < parseInt(this.diapazon.sub, 10); ch += 1) {
        const channelColSize = sizes[ch];
        for (let i = 0; i <= channelColSize - `${ch + 1}`.length - 2; i += 1) {
          output += ' ';
        }
        output += `ch${ch + 1} |`;
      }
      const rowSize = output.length;
      output += '\n';
      for (let i = 0; i <= rowSize - 1; i += 1) {
        output += '-';
      }
      output += '\n';
      // Draw body
      for (let subCh = 0; subCh < parseInt(this.subDiapazonChannelsCount, 10); subCh += 1) {
        const valueSize = `${subCh + 1}`.length;
        output += '| ';
        for (let i = 0; i < numColSize - valueSize; i += 1) {
          output += ' ';
        }
        output += `${subCh + 1} |`;
        for (let ch = 0; ch < parseInt(this.diapazon.sub, 10); ch += 1) {
          const itemSize = this.channels[ch][subCh].value.length;
          for (let i = 0; i < sizes[ch] - itemSize; i += 1) {
            output += ' ';
          }
          output += ` ${this.channels[ch][subCh].value} |`;
        }
        output += '\n';
        if (cols && subCh + 1 >= cols) {
          break;
        }
      }
      return output;
    },
    getSubCannelCharsSize(arr) {
      let size = 0;
      if (arr) {
        arr.forEach((obj) => {
          if (obj.value && obj.value.length > size) {
            size = obj.value.length;
          }
        });
      }
      return size;
    },
  },
};
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Source Sans Pro', sans-serif;
}

#title {
  padding: 1rem;
}
#preview {
  padding: 1rem;
  overflow: hidden;
  overflow-x: auto;
}
</style>
